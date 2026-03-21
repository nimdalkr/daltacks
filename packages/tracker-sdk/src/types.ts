import type { StacksNetworkName } from "@daltacks/stx-utils";

export interface ContractId {
  address: string;
  name: string;
}

export type ContractArg =
  | { type: "principal"; value: string }
  | { type: "uint"; value: number }
  | { type: "buffer"; hex: string }
  | { type: "ascii"; value: string };

export interface MissionRecord {
  id: number;
  owner: string;
  missionLabel: string;
  commitmentHash: string;
  createdAtHeight: number;
  dueAtHeight: number;
  checkInCount: number;
  lastProofHash: string | null;
  lastCheckInHeight: number | null;
  status: string;
  completedAtHeight: number | null;
}

export type SnapshotRecord = MissionRecord;

export interface BuilderProfile {
  owner: string;
  displayName: string;
  tagline: string;
  publishedAtHeight: number;
}

export interface BuilderStats {
  totalMissionsCreated: number;
  missionsCompleted: number;
  totalCheckIns: number;
  lastActiveHeight: number | null;
}

export interface BuilderBadge {
  badgeId: number;
  isClaimed: boolean;
  label: string;
}

export interface TrackerDashboard {
  principal: string;
  stxBalance: number | null;
  activeMission: MissionRecord | null;
  profile: BuilderProfile | null;
  stats: BuilderStats;
  badges: BuilderBadge[];
}

export interface TrackerSdkConfig {
  network: StacksNetworkName;
  contract: ContractId;
}

export interface CreateMissionInput {
  missionLabel: string;
  commitmentHashHex: string;
  dueAtHeight: number;
}

export interface CreateSnapshotInput {
  commitmentHashHex: string;
  dueAtHeight: number;
}

export interface CheckInInput {
  proofHashHex: string;
}

export interface PublishProfileInput {
  displayName: string;
  tagline: string;
}

export interface ClaimBadgeInput {
  badgeId: number;
}

export interface ContractCallDraft {
  contractAddress: string;
  contractName: string;
  functionName:
    | "create-mission"
    | "create-snapshot"
    | "check-in"
    | "complete-mission"
    | "publish-profile"
    | "claim-badge";
  functionArgs: ContractArg[];
  postConditionMode: "deny";
}

export interface ReadOnlyRequest {
  functionName:
    | "get-active-mission"
    | "get-active-snapshot"
    | "get-snapshot"
    | "get-snapshot-id-by-owner"
    | "get-profile"
    | "get-builder-stats"
    | "has-badge";
  args: ContractArg[];
  sender: string;
}

export interface TrackerTransport {
  callReadOnly<T>(request: ReadOnlyRequest): Promise<T>;
  getStxBalance(principal: string): Promise<number | null>;
}
