import type { SnapshotRecord } from "../types/tracker";

interface ActiveSnapshotCardProps {
  snapshot: SnapshotRecord;
  stxBalance: number | null;
}

export function ActiveSnapshotCard({ snapshot, stxBalance }: ActiveSnapshotCardProps) {
  return (
    <section className="glass rounded-[2rem] border border-white/10 p-6 shadow-panel">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Active Snapshot</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Tracking in progress</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            One active snapshot per wallet. Commitment text stays private; only the hash anchor lives on-chain.
          </p>
        </div>

        <div className="rounded-3xl border border-gold/30 bg-gold/10 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-200">STX Balance</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {stxBalance !== null ? `${stxBalance.toFixed(2)} STX` : "--"}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Metric label="Snapshot ID" value={`#${snapshot.id}`} />
        <Metric label="Due Height" value={`u${snapshot.dueAtHeight}`} />
        <Metric label="Check-ins" value={String(snapshot.checkInCount)} />
        <Metric
          label="Last Check-in"
          value={snapshot.lastCheckInHeight !== null ? `u${snapshot.lastCheckInHeight}` : "None"}
        />
      </div>

      <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/50 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Latest Proof Hash</p>
        <code className="mt-2 block overflow-x-auto text-sm text-amber-200">
          {snapshot.lastProofHash ?? "No proof yet"}
        </code>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-slate-950/45 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
    </article>
  );
}

