export type { SnapshotRecord, TrackerDashboard } from "@daltacks/tracker-sdk";

export interface ActivityItem {
  txId: string;
  title: string;
  subtitle: string | null;
  status: string;
  blockHeight: number | null;
  timestampIso: string | null;
}

export interface TokenHolding {
  assetId: string;
  contractId: string;
  name: string;
  symbol: string;
  balance: string;
  rawBalance: string;
  decimals: number | null;
  unitPriceUsd: number | null;
  valueUsd: number | null;
  priceSource: "market" | "stx-peg" | "usd-peg" | null;
}

export interface WalletPortfolio {
  stxBalance: number | null;
  lockedStx: number | null;
  stxPriceUsd: number | null;
  stxValueUsd: number | null;
  lockedStxValueUsd: number | null;
  fungibleTokens: TokenHolding[];
  defiTokens: TokenHolding[];
}

export interface SubmittedTx {
  txid: string | null;
  explorerUrl: string | null;
}
