import { assertPrincipal, toHexPrefixed } from "@daltacks/stx-utils";
import type {
  BuilderBadge,
  BuilderProfile,
  BuilderStats,
  CheckInInput,
  ClaimBadgeInput,
  ContractCallDraft,
  CreateMissionInput,
  CreateSnapshotInput,
  MissionRecord,
  PublishProfileInput,
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

function normalizeAscii(value: string, maxLength: number) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("ASCII input is required");
  }

  if (trimmed.length > maxLength) {
    throw new Error(`ASCII input must be ${maxLength} characters or fewer`);
  }

  return trimmed;
}

export class TrackerSdk {
  constructor(private readonly config: TrackerSdkConfig) {}

  async getDashboard(principal: string, transport: TrackerTransport): Promise<TrackerDashboard> {
    assertPrincipal(principal);

    const [activeMission, stxBalance, profile, stats, badges] = await Promise.all([
      this.getActiveMission(principal, transport),
      transport.getStxBalance(principal),
      this.getProfile(principal, transport),
      this.getBuilderStats(principal, transport),
      this.getBadges(principal, transport)
    ]);

    return {
      principal,
      stxBalance,
      activeMission,
      profile,
      stats,
      badges
    };
  }

  async getActiveMission(principal: string, transport: TrackerTransport): Promise<MissionRecord | null> {
    assertPrincipal(principal);

    return transport.callReadOnly<MissionRecord | null>({
      functionName: "get-active-mission",
      args: [{ type: "principal", value: principal }],
      sender: principal
    });
  }

  async getActiveSnapshot(principal: string, transport: TrackerTransport): Promise<SnapshotRecord | null> {
    return this.getActiveMission(principal, transport);
  }

  async getSnapshot(snapshotId: number, principal: string, transport: TrackerTransport): Promise<SnapshotRecord | null> {
    assertPrincipal(principal);

    return transport.callReadOnly<SnapshotRecord | null>({
      functionName: "get-snapshot",
      args: [{ type: "uint", value: snapshotId }],
      sender: principal
    });
  }

  async getProfile(principal: string, transport: TrackerTransport): Promise<BuilderProfile | null> {
    assertPrincipal(principal);

    return transport.callReadOnly<BuilderProfile | null>({
      functionName: "get-profile",
      args: [{ type: "principal", value: principal }],
      sender: principal
    });
  }

  async getBuilderStats(principal: string, transport: TrackerTransport): Promise<BuilderStats> {
    assertPrincipal(principal);

    return transport.callReadOnly<BuilderStats>({
      functionName: "get-builder-stats",
      args: [{ type: "principal", value: principal }],
      sender: principal
    });
  }

  async getBadges(principal: string, transport: TrackerTransport): Promise<BuilderBadge[]> {
    assertPrincipal(principal);

    const badgeIds = [1, 2, 3] as const;
    const labels: Record<number, string> = {
      1: "3 Check-ins",
      2: "Mission Finisher",
      3: "Public Builder"
    };

    const checks = await Promise.all(
      badgeIds.map(async (badgeId) => {
        const isClaimed = await transport.callReadOnly<boolean>({
          functionName: "has-badge",
          args: [
            { type: "principal", value: principal },
            { type: "uint", value: badgeId }
          ],
          sender: principal
        });

        return {
          badgeId,
          isClaimed,
          label: labels[badgeId]
        } satisfies BuilderBadge;
      })
    );

    return checks;
  }

  buildCreateMissionTx(input: CreateMissionInput): ContractCallDraft {
    if (input.dueAtHeight <= 0) {
      throw new Error("dueAtHeight must be positive");
    }

    return {
      contractAddress: this.config.contract.address,
      contractName: this.config.contract.name,
      functionName: "create-mission",
      functionArgs: [
        { type: "ascii", value: normalizeAscii(input.missionLabel, 48) },
        { type: "buffer", hex: normalizeHex32(input.commitmentHashHex) },
        { type: "uint", value: input.dueAtHeight }
      ],
      postConditionMode: "deny"
    };
  }

  buildCreateSnapshotTx(input: CreateSnapshotInput): ContractCallDraft {
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

  buildCompleteMissionTx(): ContractCallDraft {
    return {
      contractAddress: this.config.contract.address,
      contractName: this.config.contract.name,
      functionName: "complete-mission",
      functionArgs: [],
      postConditionMode: "deny"
    };
  }

  buildPublishProfileTx(input: PublishProfileInput): ContractCallDraft {
    return {
      contractAddress: this.config.contract.address,
      contractName: this.config.contract.name,
      functionName: "publish-profile",
      functionArgs: [
        { type: "ascii", value: normalizeAscii(input.displayName, 32) },
        { type: "ascii", value: normalizeAscii(input.tagline, 64) }
      ],
      postConditionMode: "deny"
    };
  }

  buildClaimBadgeTx(input: ClaimBadgeInput): ContractCallDraft {
    if (input.badgeId <= 0) {
      throw new Error("badgeId must be positive");
    }

    return {
      contractAddress: this.config.contract.address,
      contractName: this.config.contract.name,
      functionName: "claim-badge",
      functionArgs: [{ type: "uint", value: input.badgeId }],
      postConditionMode: "deny"
    };
  }
}
