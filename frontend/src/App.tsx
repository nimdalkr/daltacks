import { ActivityFeed } from "./components/ActivityFeed";
import { AssetPortfolioPanel } from "./components/AssetPortfolioPanel";
// import { ActiveSnapshotCard } from "./components/ActiveSnapshotCard";
// import { CheckInPanel } from "./components/CheckInPanel";
// import { CreateSnapshotPanel } from "./components/CreateSnapshotPanel";
import { EmptyState } from "./components/EmptyState";
import { InlineState } from "./components/InlineState";
import { WalletConnectButton } from "./components/WalletConnectButton";
import { WalletStatusPill } from "./components/WalletStatusPill";
import { useRecentActivity, useWalletPortfolio } from "./hooks/useTracker";
// import { useDashboard } from "./hooks/useTracker";
// import { useCreateSnapshot, useCheckIn } from "./hooks/useTracker";
import { useWalletSession } from "./hooks/useWalletSession";

const NETWORK = import.meta.env.VITE_STACKS_NETWORK ?? "mainnet";

export default function App() {
  const wallet = useWalletSession();
  // const dashboardQuery = useDashboard(wallet.principal);
  const activityQuery = useRecentActivity(wallet.principal);
  const portfolioQuery = useWalletPortfolio(wallet.principal);
  // Snapshot / check-in write flows are intentionally disabled for the current
  // read-only explorer mode.
  // const createSnapshotMutation = useCreateSnapshot(wallet.principal);
  // const checkInMutation = useCheckIn(wallet.principal);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 text-slate-100 md:px-8">
      <header className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Stacks Wallet Activity</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight text-white md:text-6xl">
            Inspect recent mainnet activity from a connected wallet.
          </h1>
        </div>

        <div className="flex flex-col items-start gap-3 md:items-end">
          <WalletStatusPill principal={wallet.principal} network={NETWORK} />
          <WalletConnectButton
            isSignedIn={wallet.isSignedIn}
            onConnect={wallet.connect}
            onDisconnect={wallet.disconnect}
          />
        </div>
      </header>

      {!wallet.isSignedIn ? (
        <section className="mt-10">
          <EmptyState
            title="Connect a wallet to begin."
            body="Once connected, the app resolves your Stacks address and loads recent mainnet transactions."
          />
        </section>
      ) : null}

      {wallet.isSignedIn ? (
        <section className="mt-10 space-y-6">
          <div className="space-y-6">
            {portfolioQuery.isLoading ? <InlineState message="Loading wallet assets..." tone="loading" /> : null}

            {portfolioQuery.error instanceof Error ? (
              <InlineState message={portfolioQuery.error.message} tone="error" />
            ) : null}

            {!portfolioQuery.isLoading && !portfolioQuery.error && portfolioQuery.data ? (
              <AssetPortfolioPanel portfolio={portfolioQuery.data} />
            ) : null}

            {activityQuery.isLoading ? <InlineState message="Loading recent activity..." tone="loading" /> : null}

            {activityQuery.error instanceof Error ? (
              <InlineState message={activityQuery.error.message} tone="error" />
            ) : null}

            {!activityQuery.isLoading && !activityQuery.error ? (
              <ActivityFeed items={activityQuery.data ?? []} network={NETWORK as "mainnet" | "testnet" | "devnet"} />
            ) : null}
          </div>
        </section>
      ) : null}
    </main>
  );
}
