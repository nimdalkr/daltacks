import type { BuilderProfile, BuilderStats, ProofScore } from "../types/tracker";

interface QuestBoardPanelProps {
  proofScore: ProofScore;
  stats: BuilderStats;
  profile: BuilderProfile | null;
}

export function QuestBoardPanel({ proofScore, stats, profile }: QuestBoardPanelProps) {
  const quests = [
    {
      title: "Mainnet Deployer",
      status: proofScore.contractDeployments > 0 ? "Complete" : "Pending",
      detail: "Deploy at least one meaningful contract on mainnet."
    },
    {
      title: "Fee Runner",
      status: proofScore.totalFeesMicroStx >= 3000 ? "Complete" : "Pending",
      detail: "Generate real fee spend through repeated mainnet actions."
    },
    {
      title: "Protocol Scout",
      status: proofScore.activeProtocolCount >= 2 ? "Complete" : "Pending",
      detail: "Use at least two Stacks ecosystem protocols."
    },
    {
      title: "Public Builder",
      status: stats.totalCheckIns >= 7 && profile ? "Complete" : "Pending",
      detail: "Reach 7 check-ins and publish a public builder profile."
    }
  ] as const;

  return (
    <section className="tactical-panel panel-cut rounded-[1.9rem] p-5 md:p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="section-label">Quest Board</p>
          <h2 className="mt-3 text-2xl font-semibold uppercase tracking-[-0.03em] text-stone-100">
            Mainnet Progress Quests
          </h2>
        </div>
        <p className="mono text-[11px] uppercase tracking-[0.2em] text-stone-500">Quality Over Volume</p>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {quests.map((quest) => (
          <article key={quest.title} className="metric-card panel-cut rounded-[1.35rem] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.03em] text-stone-100">{quest.title}</p>
                <p className="mt-2 text-sm leading-6 text-stone-400">{quest.detail}</p>
              </div>
              <span
                className={`rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                  quest.status === "Complete"
                    ? "border border-[rgba(34,197,94,0.28)] bg-[rgba(34,197,94,0.1)] text-emerald-200"
                    : "border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] text-stone-400"
                }`}
              >
                {quest.status}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
