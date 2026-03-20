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
const CONTRACT_NAME = import.meta.env.VITE_CONTRACT_NAME ?? "tracker";
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS ?? "ST000000000000000000002AMW42H";

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

      return {
        assetId: item.assetId,
        contractId: item.contractId,
        name: metadata.name,
        symbol: metadata.symbol,
        rawBalance: item.rawBalance,
        balance: formatTokenBalance(item.rawBalance, decimals),
        decimals
      } satisfies TokenHolding;
    })
    .filter((item): item is TokenHolding => item !== null)
    .sort((left, right) => compareRawBalances(left.rawBalance, right.rawBalance));

  const lockedStx = fromMicroStx(payload.stx?.locked) ?? null;
  const defiTokens = fungibleTokens.filter(isDefiLikeHolding);

  if (lockedStx && lockedStx > 0) {
    defiTokens.unshift({
      assetId: "stx-locked",
      contractId: principal,
      name: "Locked STX",
      symbol: "STX",
      rawBalance: String(payload.stx?.locked ?? "0"),
      balance: `${lockedStx.toFixed(2)} STX`,
      decimals: 6
    });
  }

  return {
    stxBalance: fromMicroStx(payload.stx?.balance) ?? null,
    lockedStx,
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
