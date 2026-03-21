import { request } from "@stacks/connect";
import {
  bufferCV,
  cvToHex,
  cvToValue,
  deserializeCV,
  principalCV,
  stringAsciiCV,
  uintCV
} from "@stacks/transactions";
import {
  getTrackedCoinGeckoIds,
  fromMicroStx,
  getExplorerTxUrl,
  getStacksApiBaseUrl,
  resolveKnownTokenPrice,
  type StacksNetworkName
} from "@daltacks/stx-utils";
import {
  TrackerSdk,
  type BuilderBadge,
  type BuilderProfile,
  type BuilderStats,
  type ContractArg,
  type ContractCallDraft,
  type MissionRecord,
  type ReadOnlyRequest,
  type TrackerDashboard,
  type TrackerSdkConfig,
  type TrackerTransport
} from "@daltacks/tracker-sdk";
import type { ActivityItem, MissionConsole, ProofScore, SubmittedTx, TokenHolding, WalletPortfolio } from "../types/tracker";

const NETWORK = (import.meta.env.VITE_STACKS_NETWORK ?? "mainnet") as StacksNetworkName;
const API_BASE_URL = import.meta.env.VITE_STACKS_API_BASE_URL ?? getStacksApiBaseUrl(NETWORK);
const CONTRACT_NAME = import.meta.env.VITE_CONTRACT_NAME ?? "tracker";
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS ?? "ST000000000000000000002AMW42H";
const MIN_VISIBLE_ASSET_VALUE_USD = 1;
const PROTOCOL_MARKERS = [
  { label: "Stacking DAO", patterns: ["stacking-dao", "stackingdao", "ststx"] },
  { label: "Zest", patterns: ["zest"] },
  { label: "Bitflow", patterns: ["bitflow"] },
  { label: "Velar", patterns: ["velar"] }
] as const;

export const trackerConfig: TrackerSdkConfig = {
  network: NETWORK,
  contract: {
    address: CONTRACT_ADDRESS,
    name: CONTRACT_NAME
  }
};

export const trackerSdk = new TrackerSdk(trackerConfig);

function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.replace(/^0x/, "");
  const output = new Uint8Array(normalized.length / 2);

  for (let index = 0; index < normalized.length; index += 2) {
    output[index / 2] = Number.parseInt(normalized.slice(index, index + 2), 16);
  }

  return output;
}

function toClarityArg(arg: ContractArg) {
  switch (arg.type) {
    case "principal":
      return principalCV(arg.value);
    case "uint":
      return uintCV(arg.value);
    case "buffer":
      return bufferCV(hexToBytes(arg.hex));
    case "ascii":
      return stringAsciiCV(arg.value);
    default:
      throw new Error("Unsupported contract argument");
  }
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}

function toHex(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    return value.startsWith("0x") ? value : `0x${value}`;
  }

  if (value instanceof Uint8Array) {
    return `0x${Array.from(value, (item) => item.toString(16).padStart(2, "0")).join("")}`;
  }

  return null;
}

function normalizeMission(value: unknown): MissionRecord | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const mission = value as Record<string, unknown>;

  return {
    id: toNumber(mission.id) ?? 0,
    owner: String(mission.owner ?? ""),
    missionLabel: String(mission["mission-label"] ?? mission.missionLabel ?? "mission"),
    commitmentHash: toHex(mission["commitment-hash"] ?? mission.commitmentHash) ?? "0x",
    createdAtHeight: toNumber(mission["created-at-height"] ?? mission.createdAtHeight) ?? 0,
    dueAtHeight: toNumber(mission["due-at-height"] ?? mission.dueAtHeight) ?? 0,
    checkInCount: toNumber(mission["check-in-count"] ?? mission.checkInCount) ?? 0,
    lastProofHash: toHex(mission["last-proof-hash"] ?? mission.lastProofHash),
    lastCheckInHeight: toNumber(mission["last-check-in-height"] ?? mission.lastCheckInHeight),
    status: String(mission.status ?? "active"),
    completedAtHeight: toNumber(mission["completed-at-height"] ?? mission.completedAtHeight)
  };
}

function normalizeProfile(value: unknown): BuilderProfile | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const profile = value as Record<string, unknown>;

  return {
    owner: String(profile.owner ?? ""),
    displayName: String(profile["display-name"] ?? profile.displayName ?? ""),
    tagline: String(profile.tagline ?? ""),
    publishedAtHeight: toNumber(profile["published-at-height"] ?? profile.publishedAtHeight) ?? 0
  };
}

function normalizeBuilderStats(value: unknown): BuilderStats {
  if (!value || typeof value !== "object") {
    return {
      totalMissionsCreated: 0,
      missionsCompleted: 0,
      totalCheckIns: 0,
      lastActiveHeight: null
    };
  }

  const stats = value as Record<string, unknown>;

  return {
    totalMissionsCreated: toNumber(stats["total-missions-created"] ?? stats.totalMissionsCreated) ?? 0,
    missionsCompleted: toNumber(stats["missions-completed"] ?? stats.missionsCompleted) ?? 0,
    totalCheckIns: toNumber(stats["total-check-ins"] ?? stats.totalCheckIns) ?? 0,
    lastActiveHeight: toNumber(stats["last-active-height"] ?? stats.lastActiveHeight)
  };
}

function formatActivityTitle(txType: string | null | undefined, functionName?: string) {
  if (txType === "contract_call") {
    if (functionName) {
      return functionName
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
    }

    return "Contract Call";
  }

  if (!txType) {
    return "Unknown Transaction";
  }

  return txType
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeNonNegativeBalance(value: string | null | undefined) {
  if (!value || !/^\d+$/.test(value)) {
    return "0";
  }

  return value;
}

function formatTokenBalance(rawValue: string, decimals: number | null) {
  if (decimals === null || decimals < 0) {
    return rawValue;
  }

  const padded = rawValue.padStart(decimals + 1, "0");
  const whole = padded.slice(0, padded.length - decimals) || "0";
  const fraction = padded.slice(padded.length - decimals).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}

function toContractId(assetId: string) {
  return assetId.split("::")[0] ?? assetId;
}

function inferTokenName(assetId: string) {
  return assetId.split("::")[1] ?? assetId;
}

function isDefiLikeHolding(item: TokenHolding) {
  const value = `${item.name} ${item.symbol} ${item.contractId}`.toLowerCase();
  const compact = value.replace(/[^a-z0-9]/g, "");
  return (
    /(lp|pool|vault|stake|staked|yield|farm|liquidity|receipt|share|restake|restaked|liquid)/.test(value) ||
    /(ststx|rststx|ststxbtc|sstx|lst)/.test(compact)
  );
}

function compareRawBalances(left: string, right: string) {
  const leftValue = BigInt(left);
  const rightValue = BigInt(right);

  if (leftValue === rightValue) {
    return 0;
  }

  return leftValue > rightValue ? -1 : 1;
}

function toFiniteNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toUsdValue(balance: string, unitPriceUsd: number | null) {
  const quantity = toFiniteNumber(balance);

  if (quantity === null || unitPriceUsd === null) {
    return null;
  }

  return quantity * unitPriceUsd;
}

function shouldDisplayAsset(item: Pick<TokenHolding, "valueUsd">) {
  return item.valueUsd === null || item.valueUsd >= MIN_VISIBLE_ASSET_VALUE_USD;
}

function extractActiveProtocols(contractIds: string[]) {
  const catalog = new Set<string>();

  for (const contractId of contractIds) {
    const normalized = contractId.toLowerCase();

    for (const marker of PROTOCOL_MARKERS) {
      if (marker.patterns.some((pattern) => normalized.includes(pattern))) {
        catalog.add(marker.label);
      }
    }
  }

  return Array.from(catalog);
}

function buildOpportunities(
  dashboard: TrackerDashboard,
  stats: Pick<ProofScore, "contractDeployments" | "successfulTransactions" | "activeProtocolCount">
) {
  const suggestions: string[] = [];

  if (stats.contractDeployments === 0) {
    suggestions.push("Deploy one meaningful mainnet contract to unlock the strongest proof signal.");
  }

  if (dashboard.stats.totalCheckIns < 3) {
    suggestions.push("Reach 3 mission check-ins to secure your first streak badge.");
  }

  if (stats.activeProtocolCount < 2) {
    suggestions.push("Use two Stacks ecosystem protocols to broaden your proof surface.");
  }

  if (!dashboard.profile) {
    suggestions.push("Publish a public builder profile so judges can verify your mission identity.");
  }

  if (stats.successfulTransactions < 8) {
    suggestions.push("Push more successful mainnet actions through DALTACKS to strengthen usage evidence.");
  }

  return suggestions.slice(0, 3);
}

async function fetchKnownUsdPrices() {
  try {
    const response = await fetch("/api/prices");

    if (!response.ok) {
      return new Map<string, number>();
    }

    const payload = (await response.json()) as {
      prices?: Record<string, number>;
    };

    const priceEntries = Object.entries(payload.prices ?? {}).filter(
      (entry): entry is [string, number] => typeof entry[1] === "number"
    );

    return new Map(priceEntries.filter(([coinId]) => getTrackedCoinGeckoIds().includes(coinId)));
  } catch {
    return new Map<string, number>();
  }
}

async function fetchTokenMetadata(contractId: string) {
  const response = await fetch(`${API_BASE_URL}/metadata/v1/ft/${encodeURIComponent(contractId)}`);

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    name?: string;
    symbol?: string;
    decimals?: number;
  };

  return {
    name: payload.name ?? inferTokenName(contractId),
    symbol: payload.symbol ?? inferTokenName(contractId).toUpperCase(),
    decimals: typeof payload.decimals === "number" ? payload.decimals : null
  };
}

async function decodeReadOnlyResult(response: Response, request: ReadOnlyRequest) {
  const payload = (await response.json()) as { okay?: boolean; result?: string; cause?: string };

  if (!payload.okay || !payload.result) {
    throw new Error(payload.cause ?? `Read-only call failed: ${request.functionName}`);
  }

  const clarityValue = deserializeCV(payload.result);
  const value = cvToValue(clarityValue);

  switch (request.functionName) {
    case "get-active-mission":
    case "get-active-snapshot":
    case "get-snapshot":
      return normalizeMission(value);
    case "get-profile":
      return normalizeProfile(value);
    case "get-builder-stats":
      return normalizeBuilderStats(value);
    case "get-snapshot-id-by-owner":
      return toNumber(value);
    case "has-badge":
      return Boolean(value);
    default:
      return value;
  }
}

async function fetchOnchainEvidence(principal: string, limit = 50) {
  const response = await fetch(
    `${API_BASE_URL}/extended/v2/addresses/${principal}/transactions?limit=${limit}&offset=0&exclude_function_args=true`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch recent contract activity");
  }

  const payload = (await response.json()) as {
    results?: Array<{
      tx?: {
        tx_id?: string;
        tx_status?: string;
        block_height?: number;
        block_time_iso?: string;
        tx_type?: string;
        sender_address?: string;
        fee_rate?: string;
        contract_call?: {
          contract_id?: string;
          function_name?: string;
        };
        smart_contract?: {
          contract_id?: string;
        };
      };
    }>;
  };

  return (payload.results ?? [])
    .map((entry) => entry.tx)
    .filter((tx): tx is NonNullable<typeof tx> => Boolean(tx));
}

export function createTrackerTransport(): TrackerTransport {
  return {
    async callReadOnly<T>(request: ReadOnlyRequest) {
      const response = await fetch(
        `${API_BASE_URL}/v2/contracts/call-read/${trackerConfig.contract.address}/${trackerConfig.contract.name}/${request.functionName}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            sender: request.sender,
            arguments: request.args.map((arg: ContractArg) => cvToHex(toClarityArg(arg)))
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Read-only request failed with status ${response.status}`);
      }

      return (await decodeReadOnlyResult(response, request)) as T;
    },

    async getStxBalance(principal: string) {
      const response = await fetch(`${API_BASE_URL}/extended/v1/address/${principal}/balances`);

      if (!response.ok) {
        return null;
      }

      const payload = (await response.json()) as {
        stx?: {
          balance?: string;
        };
      };

      return fromMicroStx(payload.stx?.balance) ?? null;
    }
  };
}

export async function getMissionConsole(principal: string): Promise<MissionConsole> {
  const transport = createTrackerTransport();
  const [dashboard, transactions] = await Promise.all([
    trackerSdk.getDashboard(principal, transport),
    fetchOnchainEvidence(principal, 60)
  ]);

  const successfulTransactions = transactions.filter((tx) => tx.tx_status === "success");
  const contractIds = successfulTransactions
    .map((tx) => tx.contract_call?.contract_id ?? tx.smart_contract?.contract_id ?? null)
    .filter((value): value is string => Boolean(value));
  const activeProtocols = extractActiveProtocols(contractIds);
  const totalFeesMicroStx = successfulTransactions.reduce((sum, tx) => sum + Number(tx.fee_rate ?? "0"), 0);
  const contractDeployments = successfulTransactions.filter((tx) => tx.tx_type === "smart_contract").length;
  const uniqueContracts = new Set(contractIds).size;
  const proofScore =
    contractDeployments * 40 +
    dashboard.stats.missionsCompleted * 20 +
    dashboard.stats.totalCheckIns * 4 +
    uniqueContracts * 8 +
    activeProtocols.length * 12 +
    Math.min(successfulTransactions.length, 20) * 2 +
    Math.min(totalFeesMicroStx / 100_000, 30);

  const scorecard: ProofScore = {
    successfulTransactions: successfulTransactions.length,
    contractDeployments,
    totalFeesMicroStx,
    uniqueContracts,
    activeProtocolCount: activeProtocols.length,
    activeProtocols,
    proofScore,
    opportunities: buildOpportunities(dashboard, {
      contractDeployments,
      successfulTransactions: successfulTransactions.length,
      activeProtocolCount: activeProtocols.length
    })
  };

  return {
    dashboard,
    proofScore: scorecard
  };
}

export async function getWalletPortfolio(principal: string): Promise<WalletPortfolio> {
  const response = await fetch(`${API_BASE_URL}/extended/v1/address/${principal}/balances`);

  if (!response.ok) {
    throw new Error("Failed to fetch wallet balances");
  }

  const payload = (await response.json()) as {
    stx?: {
      balance?: string;
      locked?: string;
    };
    fungible_tokens?: Record<
      string,
      {
        balance?: string;
      }
    >;
  };

  const assetEntries = Object.entries(payload.fungible_tokens ?? {})
    .map(([assetId, value]) => ({
      assetId,
      contractId: toContractId(assetId),
      rawBalance: normalizeNonNegativeBalance(value?.balance)
    }))
    .filter((item) => item.rawBalance !== "0");

  const knownUsdPrices = await fetchKnownUsdPrices();

  const metadataByContract = new Map(
    (
      await Promise.all(
        assetEntries.map(async (item) => {
          const metadata = await fetchTokenMetadata(item.contractId);
          return [item.contractId, metadata] as const;
        })
      )
    ).filter((entry) => entry[1] !== null)
  );

  const fungibleTokens = assetEntries
    .map((item) => {
      const metadata = metadataByContract.get(item.contractId) ?? null;

      if (!metadata) {
        return null;
      }

      const decimals = metadata.decimals ?? null;
      const balance = formatTokenBalance(item.rawBalance, decimals);
      const price = resolveKnownTokenPrice(
        {
          name: metadata.name,
          symbol: metadata.symbol
        },
        knownUsdPrices
      );

      return {
        assetId: item.assetId,
        contractId: item.contractId,
        name: metadata.name,
        symbol: metadata.symbol,
        rawBalance: item.rawBalance,
        balance,
        decimals,
        unitPriceUsd: price.unitPriceUsd,
        valueUsd: toUsdValue(balance, price.unitPriceUsd),
        priceSource: price.priceSource
      } satisfies TokenHolding;
    })
    .filter((item): item is TokenHolding => item !== null)
    .filter(shouldDisplayAsset)
    .sort((left, right) => compareRawBalances(left.rawBalance, right.rawBalance));

  const lockedStx = fromMicroStx(payload.stx?.locked) ?? null;
  const stxBalance = fromMicroStx(payload.stx?.balance) ?? null;
  const stxPriceUsd = knownUsdPrices.get("stacks") ?? null;
  const defiTokens = fungibleTokens.filter(isDefiLikeHolding);

  if (lockedStx && lockedStx > 0) {
    defiTokens.unshift({
      assetId: "stx-locked",
      contractId: principal,
      name: "Locked STX",
      symbol: "STX",
      rawBalance: String(payload.stx?.locked ?? "0"),
      balance: `${lockedStx.toFixed(2)} STX`,
      decimals: 6,
      unitPriceUsd: stxPriceUsd,
      valueUsd: stxPriceUsd !== null ? lockedStx * stxPriceUsd : null,
      priceSource: stxPriceUsd !== null ? "market" : null
    });
  }

  return {
    stxBalance,
    lockedStx,
    stxPriceUsd,
    stxValueUsd: stxBalance !== null && stxPriceUsd !== null ? stxBalance * stxPriceUsd : null,
    lockedStxValueUsd: lockedStx !== null && stxPriceUsd !== null ? lockedStx * stxPriceUsd : null,
    fungibleTokens,
    defiTokens
  };
}

export async function getCurrentBlockHeight() {
  const response = await fetch(`${API_BASE_URL}/v2/info`);

  if (!response.ok) {
    throw new Error("Failed to fetch current block height");
  }

  const payload = (await response.json()) as { stacks_tip_height?: number };
  return payload.stacks_tip_height ?? 0;
}

export async function hashTextToHex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const output = Array.from(new Uint8Array(digest), (item) => item.toString(16).padStart(2, "0")).join("");
  return `0x${output}`;
}

export async function getRecentActivity(principal: string, limit = 12): Promise<ActivityItem[]> {
  const transactions = await fetchOnchainEvidence(principal, limit);

  return transactions.map((tx) => ({
    txId: tx.tx_id ?? "",
    title: formatActivityTitle(tx.tx_type, tx.contract_call?.function_name),
    subtitle: tx.contract_call?.contract_id ?? tx.smart_contract?.contract_id ?? tx.sender_address ?? null,
    status: tx.tx_status ?? "unknown",
    blockHeight: tx.block_height ?? null,
    timestampIso: tx.block_time_iso ?? null
  }));
}

async function submitContractCall(draft: ContractCallDraft): Promise<SubmittedTx> {
  const result = await request("stx_callContract", {
    contract: `${draft.contractAddress}.${draft.contractName}`,
    functionName: draft.functionName,
    functionArgs: draft.functionArgs.map(toClarityArg),
    network: NETWORK,
    postConditionMode: draft.postConditionMode
  });

  return {
    txid: result.txid ?? null,
    explorerUrl: result.txid ? getExplorerTxUrl(NETWORK, result.txid) : null
  };
}

export async function createMission(missionLabel: string, commitmentHashHex: string, dueAtHeight: number) {
  return submitContractCall(
    trackerSdk.buildCreateMissionTx({
      missionLabel,
      commitmentHashHex,
      dueAtHeight
    })
  );
}

export async function submitCheckIn(proofHashHex: string) {
  return submitContractCall(trackerSdk.buildCheckInTx({ proofHashHex }));
}

export async function completeMission() {
  return submitContractCall(trackerSdk.buildCompleteMissionTx());
}

export async function publishProfile(displayName: string, tagline: string) {
  return submitContractCall(
    trackerSdk.buildPublishProfileTx({
      displayName,
      tagline
    })
  );
}

export async function claimBadge(badgeId: number) {
  return submitContractCall(trackerSdk.buildClaimBadgeTx({ badgeId }));
}
