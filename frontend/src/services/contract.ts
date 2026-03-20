// import { request } from "@stacks/connect";
import {
  bufferCV,
  cvToHex,
  cvToValue,
  deserializeCV,
  principalCV,
  uintCV
} from "@stacks/transactions";
import {
  fromMicroStx,
  getStacksApiBaseUrl,
  type StacksNetworkName
} from "@daltacks/stx-utils";
import {
  TrackerSdk,
  type ContractArg,
  type ReadOnlyRequest,
  type SnapshotRecord,
  type TrackerSdkConfig,
  type TrackerTransport
} from "@daltacks/tracker-sdk";
// import { type ContractCallDraft } from "@daltacks/tracker-sdk";
import type { ActivityItem, TokenHolding, WalletPortfolio } from "../types/tracker";
// import type { SubmittedTx } from "../types/tracker";

const NETWORK = (import.meta.env.VITE_STACKS_NETWORK ?? "mainnet") as StacksNetworkName;
const API_BASE_URL = import.meta.env.VITE_STACKS_API_BASE_URL ?? getStacksApiBaseUrl(NETWORK);
const COINGECKO_API_BASE_URL = import.meta.env.VITE_COINGECKO_API_BASE_URL ?? "https://api.coingecko.com/api/v3";
const COINGECKO_DEMO_API_KEY = import.meta.env.VITE_COINGECKO_DEMO_API_KEY ?? "";
const CONTRACT_NAME = import.meta.env.VITE_CONTRACT_NAME ?? "tracker";
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS ?? "ST000000000000000000002AMW42H";
const DIRECT_PRICE_IDS_BY_SYMBOL: Record<string, string> = {
  STX: "stacks",
  STSTX: "stacking-dao",
  DIKO: "arkadiko",
  ZEST: "zest-protocol"
};
const STX_PEG_SYMBOLS = new Set(["STSTX", "RSTSTX", "LSTSTX", "WSTSTX"]);
const USD_PEG_SYMBOLS = new Set(["USDA", "AEUSDC", "USDC", "USDT"]);

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

function normalizeSnapshot(value: unknown): SnapshotRecord | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const snapshot = value as Record<string, unknown>;

  return {
    id: toNumber(snapshot.id) ?? 0,
    owner: String(snapshot.owner ?? ""),
    commitmentHash: toHex(snapshot["commitment-hash"] ?? snapshot.commitmentHash) ?? "0x",
    createdAtHeight: toNumber(snapshot["created-at-height"] ?? snapshot.createdAtHeight) ?? 0,
    dueAtHeight: toNumber(snapshot["due-at-height"] ?? snapshot.dueAtHeight) ?? 0,
    checkInCount: toNumber(snapshot["check-in-count"] ?? snapshot.checkInCount) ?? 0,
    lastProofHash: toHex(snapshot["last-proof-hash"] ?? snapshot.lastProofHash),
    lastCheckInHeight: toNumber(snapshot["last-check-in-height"] ?? snapshot.lastCheckInHeight)
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

function normalizeTokenKey(value: string) {
  return value.replace(/[^a-z0-9]/gi, "").toUpperCase();
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

async function fetchKnownUsdPrices() {
  const coinIds = Array.from(new Set(Object.values(DIRECT_PRICE_IDS_BY_SYMBOL)));
  const endpoint = new URL(`${COINGECKO_API_BASE_URL}/simple/price`);
  endpoint.searchParams.set("ids", coinIds.join(","));
  endpoint.searchParams.set("vs_currencies", "usd");

  if (COINGECKO_DEMO_API_KEY) {
    endpoint.searchParams.set("x_cg_demo_api_key", COINGECKO_DEMO_API_KEY);
  }

  try {
    const response = await fetch(endpoint.toString());

    if (!response.ok) {
      return new Map<string, number>();
    }

    const payload = (await response.json()) as Record<string, { usd?: number }>;

    return new Map(
      Object.entries(payload)
        .map(([coinId, value]) => [coinId, value.usd] as const)
        .filter((entry): entry is readonly [string, number] => typeof entry[1] === "number")
    );
  } catch {
    return new Map<string, number>();
  }
}

function resolveTokenPrice(
  item: Pick<TokenHolding, "name" | "symbol">,
  knownUsdPrices: Map<string, number>
): Pick<TokenHolding, "unitPriceUsd" | "priceSource"> {
  const symbol = normalizeTokenKey(item.symbol);
  const name = normalizeTokenKey(item.name);
  const directCoinId = DIRECT_PRICE_IDS_BY_SYMBOL[symbol];

  if (directCoinId) {
    const unitPriceUsd = knownUsdPrices.get(directCoinId) ?? null;

    if (unitPriceUsd !== null) {
      return {
        unitPriceUsd,
        priceSource: "market"
      };
    }
  }

  const stxPriceUsd = knownUsdPrices.get("stacks") ?? null;

  if (
    stxPriceUsd !== null &&
    (STX_PEG_SYMBOLS.has(symbol) || /STACKEDSTACKS|RESTAKEDSTACKS|LIQUIDSTACKS/.test(name))
  ) {
    return {
      unitPriceUsd: stxPriceUsd,
      priceSource: "stx-peg"
    };
  }

  if (USD_PEG_SYMBOLS.has(symbol) || /USDCOIN|ARKADIKODOLLAR|USDA/.test(name)) {
    return {
      unitPriceUsd: 1,
      priceSource: "usd-peg"
    };
  }

  return {
    unitPriceUsd: null,
    priceSource: null
  };
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
    case "get-active-snapshot":
    case "get-snapshot":
      return normalizeSnapshot(value);
    case "get-snapshot-id-by-owner":
      return toNumber(value);
    default:
      return value;
  }
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
      const price = resolveTokenPrice(
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
          contract_call?: {
            contract_id?: string;
            function_name?: string;
          };
        };
    }>;
  };

  return (payload.results ?? [])
    .map((entry) => entry.tx)
    .filter((tx): tx is NonNullable<typeof tx> => Boolean(tx))
    .map((tx) => ({
      txId: tx.tx_id ?? "",
      title: formatActivityTitle(tx.tx_type, tx.contract_call?.function_name),
      subtitle: tx.contract_call?.contract_id ?? tx.sender_address ?? null,
      status: tx.tx_status ?? "unknown",
      blockHeight: tx.block_height ?? null,
      timestampIso: tx.block_time_iso ?? null
    }));
}

/*
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

export async function createSnapshot(commitmentHashHex: string, dueAtHeight: number) {
  return submitContractCall(trackerSdk.buildCreateSnapshotTx({ commitmentHashHex, dueAtHeight }));
}

export async function submitCheckIn(proofHashHex: string) {
  return submitContractCall(trackerSdk.buildCheckInTx({ proofHashHex }));
}
*/
