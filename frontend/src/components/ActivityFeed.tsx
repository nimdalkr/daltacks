import { getExplorerTxUrl, truncatePrincipal, type StacksNetworkName } from "@daltacks/stx-utils";
import type { ActivityItem } from "../types/tracker";

interface ActivityFeedProps {
  items: ActivityItem[];
  network: StacksNetworkName;
}

export function ActivityFeed({ items, network }: ActivityFeedProps) {
  return (
    <section className="tactical-panel panel-cut rounded-[1.9rem] p-5 md:p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="section-label">Recent Activity</p>
          <h2 className="mt-3 text-2xl font-semibold uppercase tracking-[-0.03em] text-stone-100">
            Wallet Transaction Feed
          </h2>
        </div>
        <p className="mono text-[11px] uppercase tracking-[0.2em] text-stone-500">Indexed Mainnet Flow</p>
      </div>

      <div className="mt-6 space-y-3">
        {items.length === 0 ? (
          <div className="tactical-empty panel-cut rounded-[1.35rem] px-4 py-6 text-sm text-stone-400">
            No on-chain transactions found for this address yet.
          </div>
        ) : null}

        {items.map((item) => (
          <article
            key={item.txId}
            className="metric-card panel-cut relative rounded-[1.35rem] px-4 py-4 transition hover:border-[rgba(255,123,0,0.4)]"
          >
            <a
              href={getExplorerTxUrl(network, item.txId)}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open transaction ${item.txId} in explorer`}
              className="absolute inset-0 z-10"
            />
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.03em] text-stone-100">{item.title}</p>
                {item.subtitle ? <p className="mono mt-1 text-xs text-stone-400">{item.subtitle}</p> : null}
                <p className="mono mt-2 text-[11px] uppercase tracking-[0.2em] text-stone-500">
                  {item.status} {item.blockHeight !== null ? `- block ${item.blockHeight}` : ""}
                </p>
              </div>

              <div className="text-right">
                <p className="mono text-[11px] text-stone-500">{item.timestampIso ?? "Pending timestamp"}</p>
                <span className="mono mt-2 block text-xs text-orange-200 transition hover:text-orange-100">
                  {truncatePrincipal(item.txId, 10)}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
