import type { ProofScore } from "../types/tracker";

interface ProofScorePanelProps {
  proofScore: ProofScore;
}

export function ProofScorePanel({ proofScore }: ProofScorePanelProps) {
  return (
    <section className="tactical-panel panel-cut p-5 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="section-label">Proof Score</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-stone-100">
            Mainnet Builder Surface
          </h2>
        </div>
        <div className="metric-card panel-cut px-4 py-3 text-right">
          <p className="section-label">Total</p>
          <p className="mono mt-3 text-3xl font-semibold text-orange-200">{Math.round(proofScore.proofScore)}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Metric label="Successful Tx" value={String(proofScore.successfulTransactions)} />
        <Metric label="Deployments" value={String(proofScore.contractDeployments)} />
        <Metric label="Fees" value={`${(proofScore.totalFeesMicroStx / 1_000_000).toFixed(3)} STX`} />
        <Metric label="Contracts" value={String(proofScore.uniqueContracts)} />
        <Metric label="Protocols" value={String(proofScore.activeProtocolCount)} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="metric-card panel-cut p-4">
          <p className="section-label">Active Protocols</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {proofScore.activeProtocols.length > 0 ? (
              proofScore.activeProtocols.map((protocol) => (
                <span
                  key={protocol}
                  className="rounded-full border border-[rgba(249,115,22,0.25)] bg-[rgba(249,115,22,0.1)] px-3 py-2 text-xs font-medium text-orange-200"
                >
                  {protocol}
                </span>
              ))
            ) : (
              <p className="text-sm text-stone-400">No Stacks ecosystem protocol activity detected yet.</p>
            )}
          </div>
        </div>

        <div className="metric-card panel-cut p-4">
          <p className="section-label">Highest-Impact Next Actions</p>
          <div className="mt-4 space-y-3">
            {proofScore.opportunities.map((item, index) => (
              <div key={item} className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
                <p className="mono text-[11px] uppercase tracking-[0.14em] text-stone-500">Priority {index + 1}</p>
                <p className="mt-2 text-sm leading-6 text-stone-200">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card panel-cut px-4 py-3 text-right">
      <p className="section-label">{label}</p>
      <p className="mono mt-3 text-xl font-semibold text-stone-100">{value}</p>
    </div>
  );
}
