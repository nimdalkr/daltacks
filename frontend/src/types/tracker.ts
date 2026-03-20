export type { SnapshotRecord, TrackerDashboard } from "@daltacks/tracker-sdk";

export interface ActivityItem {
  txId: string;
  functionName: "create-snapshot" | "check-in";
  status: string;
  blockHeight: number | null;
  timestampIso: string | null;
}

export interface SubmittedTx {
  txid: string | null;
  explorerUrl: string | null;
}
