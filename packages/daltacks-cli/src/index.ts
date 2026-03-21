#!/usr/bin/env node
import process from "node:process";
import { bufferCV, cvToHex, cvToValue, deserializeCV, principalCV, stringAsciiCV, uintCV } from "@stacks/transactions";
import { getStacksApiBaseUrl, type StacksNetworkName } from "@daltacks/stx-utils";
import { TrackerSdk, type ContractArg, type ReadOnlyRequest, type TrackerTransport } from "@daltacks/tracker-sdk";

const NETWORK = (process.env.STACKS_NETWORK ?? "mainnet") as StacksNetworkName;
const API_BASE_URL = process.env.STACKS_API_BASE_URL ?? getStacksApiBaseUrl(NETWORK);
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS ?? "ST000000000000000000002AMW42H";
const CONTRACT_NAME = process.env.CONTRACT_NAME ?? "tracker";

function getOption(args: string[], name: string) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] ?? null : null;
}

function parseArg(arg: ContractArg) {
  switch (arg.type) {
    case "principal":
      return cvToHex(principalCV(arg.value));
    case "uint":
      return cvToHex(uintCV(arg.value));
    case "buffer":
      return cvToHex(bufferCV(Uint8Array.from(Buffer.from(arg.hex.replace(/^0x/, ""), "hex"))));
    case "ascii":
      return cvToHex(stringAsciiCV(arg.value));
    default:
      return null;
  }
}

function toNumber(value: unknown): number | null {
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
  if (typeof value === "string") {
    return value.startsWith("0x") ? value : `0x${value}`;
  }

  if (value instanceof Uint8Array) {
    return `0x${Array.from(value, (item) => item.toString(16).padStart(2, "0")).join("")}`;
  }

  return null;
}

function normalizeMission(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const mission = value as Record<string, unknown>;

  return {
    id: toNumber(mission.id) ?? 0,
    owner: String(mission.owner ?? ""),
    missionLabel: String(mission["mission-label"] ?? mission.missionLabel ?? ""),
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

function normalizeProfile(value: unknown) {
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

function normalizeStats(value: unknown) {
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

function decodeResult(functionName: ReadOnlyRequest["functionName"], raw: string) {
  const clarityValue = deserializeCV(raw);
  const value = cvToValue(clarityValue);

  switch (functionName) {
    case "get-active-mission":
    case "get-active-snapshot":
    case "get-snapshot":
      return normalizeMission(value);
    case "get-profile":
      return normalizeProfile(value);
    case "get-builder-stats":
      return normalizeStats(value);
    case "get-snapshot-id-by-owner":
      return toNumber(value);
    case "has-badge":
      return Boolean(value);
    default:
      return value;
  }
}

function printUsage() {
  console.log(`daltacks <command>

Commands:
  status <principal>
  create-mission --mission-label <label> --commitment-hash <0x...> --due-at-height <uint>
  check-in --proof-hash <0x...>
  complete-mission
  publish-profile --display-name <name> --tagline <tagline>
  claim-badge --badge-id <uint>
`);
}

const transport: TrackerTransport = {
  async callReadOnly<T>(request: ReadOnlyRequest) {
    const response = await fetch(
      `${API_BASE_URL}/v2/contracts/call-read/${CONTRACT_ADDRESS}/${CONTRACT_NAME}/${request.functionName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sender: request.sender,
          arguments: request.args.map(parseArg)
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Read-only request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as { okay?: boolean; result?: string; cause?: string };

    if (!payload.okay || !payload.result) {
      throw new Error(payload.cause ?? `Read-only call failed: ${request.functionName}`);
    }

    return decodeResult(request.functionName, payload.result) as T;
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

    return payload.stx?.balance ? Number(payload.stx.balance) / 1_000_000 : null;
  }
};

async function main() {
  const [command, ...args] = process.argv.slice(2);
  const sdk = new TrackerSdk({
    network: NETWORK,
    contract: {
      address: CONTRACT_ADDRESS,
      name: CONTRACT_NAME
    }
  });

  if (!command) {
    printUsage();
    process.exit(1);
  }

  switch (command) {
    case "status": {
      const principal = args[0];

      if (!principal) {
        throw new Error("status requires a principal");
      }

      const dashboard = await sdk.getDashboard(principal, transport);
      console.log(JSON.stringify(dashboard, null, 2));
      return;
    }

    case "create-mission": {
      const missionLabel = getOption(args, "--mission-label");
      const commitmentHashHex = getOption(args, "--commitment-hash");
      const dueAtHeight = Number(getOption(args, "--due-at-height"));

      if (!missionLabel || !commitmentHashHex || !dueAtHeight) {
        throw new Error("create-mission requires --mission-label, --commitment-hash, and --due-at-height");
      }

      console.log(JSON.stringify(sdk.buildCreateMissionTx({ missionLabel, commitmentHashHex, dueAtHeight }), null, 2));
      return;
    }

    case "check-in": {
      const proofHashHex = getOption(args, "--proof-hash");

      if (!proofHashHex) {
        throw new Error("check-in requires --proof-hash");
      }

      console.log(JSON.stringify(sdk.buildCheckInTx({ proofHashHex }), null, 2));
      return;
    }

    case "complete-mission": {
      console.log(JSON.stringify(sdk.buildCompleteMissionTx(), null, 2));
      return;
    }

    case "publish-profile": {
      const displayName = getOption(args, "--display-name");
      const tagline = getOption(args, "--tagline");

      if (!displayName || !tagline) {
        throw new Error("publish-profile requires --display-name and --tagline");
      }

      console.log(JSON.stringify(sdk.buildPublishProfileTx({ displayName, tagline }), null, 2));
      return;
    }

    case "claim-badge": {
      const badgeId = Number(getOption(args, "--badge-id"));

      if (!badgeId) {
        throw new Error("claim-badge requires --badge-id");
      }

      console.log(JSON.stringify(sdk.buildClaimBadgeTx({ badgeId }), null, 2));
      return;
    }

    default:
      printUsage();
      process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
