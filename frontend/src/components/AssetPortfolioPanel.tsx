import { truncatePrincipal } from "@daltacks/stx-utils";
import type { TokenHolding, WalletPortfolio } from "../types/tracker";

interface AssetPortfolioPanelProps {
  portfolio: WalletPortfolio;
}

export function AssetPortfolioPanel({ portfolio }: AssetPortfolioPanelProps) {
  return (
    <section className="glass rounded-[2rem] border border-white/10 p-6 shadow-panel">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Portfolio</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Wallet assets</h2>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Metric label="STX Balance" value={formatStx(portfolio.stxBalance)} />
          <Metric label="Locked STX" value={formatStx(portfolio.lockedStx)} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <AssetList
          title="Token Holdings"
          emptyText="No fungible token balances found for this address."
          items={portfolio.fungibleTokens}
        />
        <AssetList
          title="DeFi Exposure"
          emptyText="No DeFi-like LP, vault, or staked token positions were inferred."
          items={portfolio.defiTokens}
        />
      </div>
    </section>
  );
}

function AssetList({
  title,
  emptyText,
  items
}: {
  title: string;
  emptyText: string;
  items: TokenHolding[];
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{title}</p>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">
          {emptyText}
        </div>
      ) : null}

      {items.map((item) => (
        <article key={item.assetId} className="rounded-3xl border border-white/10 bg-slate-950/45 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white">{item.name}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">{item.symbol}</p>
              <p className="mt-2 text-sm text-slate-400">{truncatePrincipal(item.contractId, 10)}</p>
            </div>

            <div className="text-right">
              <p className="text-lg font-semibold text-white">{item.balance}</p>
              <p className="mt-1 text-xs text-slate-500">{item.rawBalance}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/45 px-4 py-3 text-right">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function formatStx(value: number | null) {
  return value !== null ? `${value.toFixed(2)} STX` : "--";
}
