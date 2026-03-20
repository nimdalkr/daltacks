import { getExplorerPrincipalUrl, truncatePrincipal, type StacksNetworkName } from "@daltacks/stx-utils";
import type { TokenHolding, WalletPortfolio } from "../types/tracker";

interface AssetPortfolioPanelProps {
  portfolio: WalletPortfolio;
  network: StacksNetworkName;
}

export function AssetPortfolioPanel({ portfolio, network }: AssetPortfolioPanelProps) {
  return (
    <section className="tactical-panel panel-cut rounded-[1.9rem] p-5 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="section-label">Portfolio</p>
          <h2 className="mt-3 text-2xl font-semibold uppercase tracking-[-0.03em] text-stone-100">Wallet Assets</h2>
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
          network={network}
        />
        <AssetList
          title="DeFi Exposure"
          emptyText="No DeFi-like LP, vault, or staked token positions were inferred."
          items={portfolio.defiTokens}
          network={network}
        />
      </div>
    </section>
  );
}

function AssetList({
  title,
  emptyText,
  items,
  network
}: {
  title: string;
  emptyText: string;
  items: TokenHolding[];
  network: StacksNetworkName;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <p className="section-label">{title}</p>
        <div className="section-rule flex-1" />
      </div>

      {items.length === 0 ? (
        <div className="tactical-empty panel-cut rounded-[1.35rem] px-4 py-6 text-sm text-stone-400">
          {emptyText}
        </div>
      ) : null}

      {items.map((item) => (
        <a
          key={item.assetId}
          href={getExplorerPrincipalUrl(network, item.contractId)}
          target="_blank"
          rel="noreferrer"
          className="metric-card panel-cut block rounded-[1.35rem] p-4 transition hover:border-[rgba(255,123,0,0.4)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.03em] text-stone-100">{item.name}</p>
              <p className="mono mt-1 text-xs uppercase tracking-[0.2em] text-stone-500">{item.symbol}</p>
              <p className="mono mt-2 text-xs text-stone-400">{truncatePrincipal(item.contractId, 10)}</p>
            </div>

            <div className="text-right">
              <p className="text-lg font-semibold text-orange-200">{item.balance}</p>
              <p className="mono mt-1 text-xs text-stone-500">{item.rawBalance}</p>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card panel-cut rounded-[1.2rem] px-4 py-3 text-right">
      <p className="section-label">{label}</p>
      <p className="mono mt-3 text-2xl font-semibold text-stone-100">{value}</p>
    </div>
  );
}

function formatStx(value: number | null) {
  return value !== null ? `${value.toFixed(2)} STX` : "--";
}
