import { getExplorerTxUrl, truncatePrincipal, type StacksNetworkName } from "@daltacks/stx-utils";
import type { ActivityItem } from "../types/tracker";

interface ActivityFeedProps {
  items: ActivityItem[];
  network: StacksNetworkName;
}

export function ActivityFeed({ items, network }: ActivityFeedProps) {
  return (
    <section className="glass rounded-[2rem] border border-white/10 p-6 shadow-panel">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Recent Activity</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Wallet transaction feed</h2>
        </div>
        <p className="text-sm text-slate-400">Hiro address transactions filtered to this contract.</p>
      </div>

      <div className="mt-6 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">
            No tracker transactions found yet.
          </div>
        ) : null}

        {items.map((item) => (
          <article
            key={item.txId}
            className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4 transition hover:border-teal/40"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium capitalize text-white">{item.functionName.replace("-", " ")}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                  {item.status} {item.blockHeight !== null ? `- block ${item.blockHeight}` : ""}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-slate-400">{item.timestampIso ?? "Pending timestamp"}</p>
                <a
                  href={getExplorerTxUrl(network, item.txId)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block text-xs text-amber-200 transition hover:text-amber-100"
                >
                  {truncatePrincipal(item.txId, 10)}
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
