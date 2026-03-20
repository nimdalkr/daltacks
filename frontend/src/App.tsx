import { ActivityFeed } from "./components/ActivityFeed";
import { AssetPortfolioPanel } from "./components/AssetPortfolioPanel";
import { EmptyState } from "./components/EmptyState";
import { InlineState } from "./components/InlineState";
import { WalletConnectButton } from "./components/WalletConnectButton";
import { WalletStatusPill } from "./components/WalletStatusPill";
import { useRecentActivity, useWalletPortfolio } from "./hooks/useTracker";
import { useWalletSession } from "./hooks/useWalletSession";

const NETWORK = import.meta.env.VITE_STACKS_NETWORK ?? "mainnet";

export default function App() {
  const wallet = useWalletSession();
  const activityQuery = useRecentActivity(wallet.principal);
  const portfolioQuery = useWalletPortfolio(wallet.principal);

  return (
    <main className="tactical-app mx-auto flex min-h-screen w-full max-w-[88rem] flex-col px-4 py-6 text-stone-100 md:px-8 md:py-8">
      <header className="tactical-header panel-cut rounded-[2rem] px-5 py-5 md:px-8 md:py-7">
        <div className="hero-grid">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="tactical-chip rounded-full px-3 py-2 text-[11px] uppercase tracking-[0.3em]">
                <span className="signal-dot" />
                Neo-Futuristic Industrial
              </span>
              <span className="tactical-chip rounded-full px-3 py-2 text-[11px] uppercase tracking-[0.3em]">
                Tactical Minimalism
              </span>
            </div>

            <div className="max-w-4xl">
              <p className="section-label">Stacks Wallet Activity</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold uppercase leading-[0.95] tracking-[-0.04em] text-stone-100 md:text-7xl">
                Competitive clarity for mainnet wallet intelligence.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-stone-400 md:text-base">
                A stylized tactical console for holdings, inferred DeFi exposure, and recent transaction flow.
              </p>
            </div>
          </div>

          <div className="tactical-panel panel-cut rounded-[1.6rem] p-5">
            <div className="flex items-center justify-between">
              <p className="section-label">Command Rail</p>
              <span className="mono text-[11px] uppercase tracking-[0.28em] text-stone-500">Mainnet / Live</span>
            </div>
            <div className="section-rule mt-4" />
            <div className="mt-5 flex flex-col items-start gap-3">
              <div className="w-full">
                <WalletStatusPill principal={wallet.principal} network={NETWORK} />
              </div>
              <WalletConnectButton
                isSignedIn={wallet.isSignedIn}
                onConnect={wallet.connect}
                onDisconnect={wallet.disconnect}
              />
            </div>
          </div>
        </div>
      </header>

      {!wallet.isSignedIn ? (
        <section className="mt-6">
          <EmptyState
            title="Awaiting Wallet Link"
            body="Connect a Stacks wallet to unlock the tactical dashboard and inspect live asset positioning."
          />
        </section>
      ) : null}

      {wallet.isSignedIn ? (
        <section className="mt-6 space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="space-y-6">
              {portfolioQuery.isLoading ? <InlineState message="Loading wallet assets..." tone="loading" /> : null}

              {portfolioQuery.error instanceof Error ? (
                <InlineState message={portfolioQuery.error.message} tone="error" />
              ) : null}

              {!portfolioQuery.isLoading && !portfolioQuery.error && portfolioQuery.data ? (
                <AssetPortfolioPanel portfolio={portfolioQuery.data} />
              ) : null}
            </div>

            <div className="space-y-6">
              <section className="tactical-panel panel-cut rounded-[1.8rem] p-5 md:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="section-label">Mission Context</p>
                    <h2 className="mt-3 text-2xl font-semibold uppercase tracking-[-0.03em] text-stone-100">
                      Tactical minimalism, operational readability.
                    </h2>
                  </div>
                  <span className="mono text-[11px] uppercase tracking-[0.24em] text-stone-500">Orange Signal</span>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="metric-card panel-cut rounded-[1.3rem] px-4 py-4">
                    <p className="section-label">Layout</p>
                    <p className="mt-3 text-sm leading-6 text-stone-400">
                      Hard edges, industrial spacing, low-noise typography, and high-contrast metrics.
                    </p>
                  </div>
                  <div className="metric-card panel-cut rounded-[1.3rem] px-4 py-4">
                    <p className="section-label">Focus</p>
                    <p className="mt-3 text-sm leading-6 text-stone-400">
                      Holdings and transaction flow are prioritized over decorative motion or soft cards.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <div className="space-y-6">
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
