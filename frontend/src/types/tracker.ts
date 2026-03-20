export type { SnapshotRecord, TrackerDashboard } from "@daltacks/tracker-sdk";

export interface ActivityItem {
  txId: string;
  title: string;
  subtitle: string | null;
  status: string;
  blockHeight: number | null;
  timestampIso: string | null;
}

export interface SubmittedTx {
  txid: string | null;
  explorerUrl: string | null;
}
