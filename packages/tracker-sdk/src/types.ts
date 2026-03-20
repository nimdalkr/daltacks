import type { StacksNetworkName } from "@daltacks/stx-utils";

export interface ContractId {
  address: string;
  name: string;
}

export type ContractArg =
  | { type: "principal"; value: string }
  | { type: "uint"; value: number }
  | { type: "buffer"; hex: string };

export interface SnapshotRecord {
  id: number;
  owner: string;
  commitmentHash: string;
  createdAtHeight: number;
  dueAtHeight: number;
  checkInCount: number;
  lastProofHash: string | null;
  lastCheckInHeight: number | null;
}

export interface TrackerDashboard {
  principal: string;
  stxBalance: number | null;
  activeSnapshot: SnapshotRecord | null;
}

export interface TrackerSdkConfig {
  network: StacksNetworkName;
  contract: ContractId;
}

export interface CreateSnapshotInput {
  commitmentHashHex: string;
  dueAtHeight: number;
}

export interface CheckInInput {
  proofHashHex: string;
}

export interface ContractCallDraft {
  contractAddress: string;
  contractName: string;
  functionName: "create-snapshot" | "check-in";
  functionArgs: ContractArg[];
  postConditionMode: "deny";
}

export interface ReadOnlyRequest {
  functionName: "get-active-snapshot" | "get-snapshot" | "get-snapshot-id-by-owner";
  args: ContractArg[];
  sender: string;
}

export interface TrackerTransport {
  callReadOnly<T>(request: ReadOnlyRequest): Promise<T>;
  getStxBalance(principal: string): Promise<number | null>;
}

