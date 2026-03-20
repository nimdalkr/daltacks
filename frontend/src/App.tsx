import { ActivityFeed } from "./components/ActivityFeed";
import { ActiveSnapshotCard } from "./components/ActiveSnapshotCard";
import { CheckInPanel } from "./components/CheckInPanel";
import { CreateSnapshotPanel } from "./components/CreateSnapshotPanel";
import { EmptyState } from "./components/EmptyState";
import { InlineState } from "./components/InlineState";
import { WalletConnectButton } from "./components/WalletConnectButton";
import { WalletStatusPill } from "./components/WalletStatusPill";
import { useCreateSnapshot, useCheckIn, useDashboard, useRecentActivity } from "./hooks/useTracker";
import { useWalletSession } from "./hooks/useWalletSession";

const NETWORK = import.meta.env.VITE_STACKS_NETWORK ?? "testnet";

export default function App() {
  const wallet = useWalletSession();
  const dashboardQuery = useDashboard(wallet.principal);
  const activityQuery = useRecentActivity(wallet.principal);
  const createSnapshotMutation = useCreateSnapshot(wallet.principal);
  const checkInMutation = useCheckIn(wallet.principal);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 text-slate-100 md:px-8">
      <header className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Stacks Accountability Tracker</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight text-white md:text-6xl">
            Keep one commitment live, then prove you showed up.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Daltacks stores only hashes and timing on-chain. The daily text stays private until you decide to
            reveal it.
          </p>
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
            body="This MVP is wallet-first. Once connected, the app looks up your active tracking snapshot and unlocks the create/check-in flow."
          />
        </section>
      ) : null}

      {wallet.isSignedIn ? (
        <section className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            {dashboardQuery.isLoading ? <InlineState message="Loading active snapshot..." tone="loading" /> : null}

            {dashboardQuery.error instanceof Error ? (
              <InlineState message={dashboardQuery.error.message} tone="error" />
            ) : null}

            {dashboardQuery.data?.activeSnapshot ? (
              <ActiveSnapshotCard
                snapshot={dashboardQuery.data.activeSnapshot}
                stxBalance={dashboardQuery.data.stxBalance}
              />
            ) : null}

            {!dashboardQuery.isLoading && !dashboardQuery.data?.activeSnapshot ? (
              <EmptyState
                title="No active snapshot yet."
                body="This wallet has not started tracking. Create a single snapshot first, then use check-ins to anchor proof over time."
              />
            ) : null}

            {activityQuery.isLoading ? <InlineState message="Loading recent activity..." tone="loading" /> : null}

            {activityQuery.error instanceof Error ? (
              <InlineState message={activityQuery.error.message} tone="error" />
            ) : null}

            {!activityQuery.isLoading && !activityQuery.error ? (
              <ActivityFeed items={activityQuery.data ?? []} network={NETWORK as "mainnet" | "testnet" | "devnet"} />
            ) : null}
          </div>

          <div className="space-y-6">
            {!dashboardQuery.data?.activeSnapshot ? (
              <CreateSnapshotPanel
                isPending={createSnapshotMutation.isPending}
                onSubmit={(input) => createSnapshotMutation.mutateAsync(input)}
                errorMessage={createSnapshotMutation.error instanceof Error ? createSnapshotMutation.error.message : null}
                lastSubmittedTx={createSnapshotMutation.data ?? null}
              />
            ) : (
              <CheckInPanel
                snapshot={dashboardQuery.data.activeSnapshot}
                isPending={checkInMutation.isPending}
                onSubmit={(input) => checkInMutation.mutateAsync(input)}
                errorMessage={checkInMutation.error instanceof Error ? checkInMutation.error.message : null}
                lastSubmittedTx={checkInMutation.data ?? null}
              />
            )}
          </div>
        </section>
      ) : null}
    </main>
  );
}
