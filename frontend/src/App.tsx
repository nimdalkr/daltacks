import { ActivityFeed } from "./components/ActivityFeed";
import { AssetPortfolioPanel } from "./components/AssetPortfolioPanel";
import { BuilderProfilePanel } from "./components/BuilderProfilePanel";
import { EmptyState } from "./components/EmptyState";
import { InlineState } from "./components/InlineState";
import { MissionCommandPanel } from "./components/MissionCommandPanel";
import { ProofScorePanel } from "./components/ProofScorePanel";
import { QuestBoardPanel } from "./components/QuestBoardPanel";
import { WalletConnectButton } from "./components/WalletConnectButton";
import { WalletStatusPill } from "./components/WalletStatusPill";
import {
  useCheckIn,
  useClaimBadge,
  useCompleteMission,
  useCreateMission,
  useMissionConsole,
  usePublishProfile,
  useRecentActivity,
  useWalletPortfolio
} from "./hooks/useTracker";
import { useWalletSession } from "./hooks/useWalletSession";

const NETWORK = import.meta.env.VITE_STACKS_NETWORK ?? "mainnet";
const ECOSYSTEM_LINKS = [
  { label: "Stacks", href: "https://www.stacks.co/" },
  { label: "Stacking DAO", href: "https://www.stackingdao.com/" },
  { label: "Zest Protocol", href: "https://www.zestprotocol.com/" },
  { label: "Velar", href: "https://www.velar.co/" },
  { label: "Bitflow", href: "https://www.bitflow.finance/" },
  { label: "Hiro Explorer", href: "https://explorer.hiro.so/" }
] as const;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : null;
}

export default function App() {
  const wallet = useWalletSession();
  const missionQuery = useMissionConsole(wallet.principal);
  const activityQuery = useRecentActivity(wallet.principal);
  const portfolioQuery = useWalletPortfolio(wallet.principal);
  const createMissionMutation = useCreateMission(wallet.principal);
  const checkInMutation = useCheckIn(wallet.principal);
  const completeMissionMutation = useCompleteMission(wallet.principal);
  const publishProfileMutation = usePublishProfile(wallet.principal);
  const claimBadgeMutation = useClaimBadge(wallet.principal);

  const dashboard = missionQuery.data?.dashboard ?? null;
  const proofScore = missionQuery.data?.proofScore ?? null;

  return (
    <main className="tactical-app mx-auto flex min-h-screen w-full max-w-[88rem] flex-col px-4 py-6 text-stone-100 md:px-8 md:py-8">
      <header className="tactical-header panel-cut rounded-[2rem] px-5 py-5 md:px-8 md:py-7">
        <div className="hero-grid">
          <div className="space-y-6">
            <div className="max-w-4xl">
              <p className="section-label">Stacks Builder Console</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold uppercase leading-[0.95] tracking-[-0.04em] text-stone-100 md:text-7xl">
                DALTACKS
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-stone-400 md:text-base">
                Keep the wallet surface, then turn it into a mission-driven proof machine for real mainnet builder work.
              </p>
            </div>
          </div>

          <div className="tactical-panel panel-cut rounded-[1.6rem] p-5">
            <div className="flex items-center justify-between">
              <p className="section-label">Command Rail</p>
              <span className="mono text-[11px] uppercase tracking-[0.28em] text-stone-500">Mainnet / Missions</span>
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
            body="Connect a Stacks wallet to activate missions, publish proof, and keep assets plus transaction evidence in one place."
          />
        </section>
      ) : null}

      {wallet.isSignedIn ? (
        <section className="mt-6 space-y-6">
          {missionQuery.isLoading ? <InlineState message="Loading mission console..." tone="loading" /> : null}
          {missionQuery.error instanceof Error ? <InlineState message={missionQuery.error.message} tone="error" /> : null}

          {!missionQuery.isLoading && !missionQuery.error && dashboard && proofScore ? (
            <>
              <MissionCommandPanel
                mission={dashboard.activeMission}
                stats={dashboard.stats}
                createMissionPending={createMissionMutation.isPending}
                checkInPending={checkInMutation.isPending}
                completePending={completeMissionMutation.isPending}
                createMissionError={getErrorMessage(createMissionMutation.error)}
                checkInError={getErrorMessage(checkInMutation.error)}
                completeError={getErrorMessage(completeMissionMutation.error)}
                createMissionTx={createMissionMutation.data ?? null}
                checkInTx={checkInMutation.data ?? null}
                completeMissionTx={completeMissionMutation.data ?? null}
                onCreateMission={(input) => createMissionMutation.mutateAsync(input)}
                onCheckIn={(input) => checkInMutation.mutateAsync(input)}
                onCompleteMission={() => completeMissionMutation.mutateAsync()}
              />

              <ProofScorePanel proofScore={proofScore} />

              <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                <QuestBoardPanel
                  proofScore={proofScore}
                  stats={dashboard.stats}
                  profile={dashboard.profile}
                />
                <BuilderProfilePanel
                  profile={dashboard.profile}
                  badges={dashboard.badges}
                  publishPending={publishProfileMutation.isPending}
                  claimPendingBadgeId={claimBadgeMutation.variables?.badgeId ?? null}
                  publishError={getErrorMessage(publishProfileMutation.error)}
                  claimError={getErrorMessage(claimBadgeMutation.error)}
                  publishTx={publishProfileMutation.data ?? null}
                  claimTx={claimBadgeMutation.data ?? null}
                  onPublishProfile={(input) => publishProfileMutation.mutateAsync(input)}
                  onClaimBadge={(input) => claimBadgeMutation.mutateAsync(input)}
                />
              </div>
            </>
          ) : null}

          <div className="space-y-6">
            {portfolioQuery.isLoading ? <InlineState message="Loading wallet assets..." tone="loading" /> : null}

            {portfolioQuery.error instanceof Error ? (
              <InlineState message={portfolioQuery.error.message} tone="error" />
            ) : null}

            {!portfolioQuery.isLoading && !portfolioQuery.error && portfolioQuery.data ? (
              <AssetPortfolioPanel
                portfolio={portfolioQuery.data}
                network={NETWORK as "mainnet" | "testnet" | "devnet"}
              />
            ) : null}
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

      <footer className="mt-6">
        <section className="tactical-panel panel-cut rounded-[1.8rem] p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="section-label">Stacks Ecosystem</p>
              <h2 className="mt-3 text-2xl font-semibold uppercase tracking-[-0.03em] text-stone-100">
                Protocol Surface For Builder Missions
              </h2>
            </div>
            <span className="mono text-[11px] uppercase tracking-[0.24em] text-stone-500">Adapters / Proof Targets</span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {ECOSYSTEM_LINKS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="metric-card panel-cut block rounded-[1.2rem] px-4 py-4 transition hover:border-[rgba(255,123,0,0.4)]"
              >
                <p className="section-label">External Link</p>
                <p className="mt-3 text-lg font-semibold uppercase tracking-[0.02em] text-stone-100">{item.label}</p>
                <p className="mono mt-2 text-xs text-stone-500">{item.href.replace(/^https?:\/\//, "")}</p>
              </a>
            ))}
          </div>
        </section>
      </footer>
    </main>
  );
}
