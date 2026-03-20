import { assertPrincipal, toHexPrefixed } from "@daltacks/stx-utils";
import type {
  CheckInInput,
  ContractCallDraft,
  CreateSnapshotInput,
  SnapshotRecord,
  TrackerDashboard,
  TrackerSdkConfig,
  TrackerTransport
} from "./types";

function normalizeHex32(value: string): string {
  const hex = toHexPrefixed(value).toLowerCase();

  if (!/^0x[a-f0-9]{64}$/.test(hex)) {
    throw new Error("Expected a 32-byte hex string");
  }

  return hex;
}

export class TrackerSdk {
  constructor(private readonly config: TrackerSdkConfig) {}

  async getDashboard(principal: string, transport: TrackerTransport): Promise<TrackerDashboard> {
    assertPrincipal(principal);

    const [activeSnapshot, stxBalance] = await Promise.all([
      this.getActiveSnapshot(principal, transport),
      transport.getStxBalance(principal)
    ]);

    return {
      principal,
      stxBalance,
      activeSnapshot
    };
  }

  async getActiveSnapshot(principal: string, transport: TrackerTransport): Promise<SnapshotRecord | null> {
    assertPrincipal(principal);

    return transport.callReadOnly<SnapshotRecord | null>({
      functionName: "get-active-snapshot",
      args: [{ type: "principal", value: principal }],
      sender: principal
    });
  }

  async getSnapshot(snapshotId: number, principal: string, transport: TrackerTransport): Promise<SnapshotRecord | null> {
    assertPrincipal(principal);

    return transport.callReadOnly<SnapshotRecord | null>({
      functionName: "get-snapshot",
      args: [{ type: "uint", value: snapshotId }],
      sender: principal
    });
  }

  buildCreateSnapshotTx(input: CreateSnapshotInput): ContractCallDraft {
    if (input.dueAtHeight <= 0) {
      throw new Error("dueAtHeight must be positive");
    }

    return {
      contractAddress: this.config.contract.address,
      contractName: this.config.contract.name,
      functionName: "create-snapshot",
      functionArgs: [
        { type: "buffer", hex: normalizeHex32(input.commitmentHashHex) },
        { type: "uint", value: input.dueAtHeight }
      ],
      postConditionMode: "deny"
    };
  }

  buildCheckInTx(input: CheckInInput): ContractCallDraft {
    return {
      contractAddress: this.config.contract.address,
      contractName: this.config.contract.name,
      functionName: "check-in",
      functionArgs: [{ type: "buffer", hex: normalizeHex32(input.proofHashHex) }],
      postConditionMode: "deny"
    };
  }
}

