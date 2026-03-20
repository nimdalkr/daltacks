import { truncatePrincipal } from "@daltacks/stx-utils";

interface WalletStatusPillProps {
  principal: string | null;
  network: string;
}

export function WalletStatusPill({ principal, network }: WalletStatusPillProps) {
  return (
    <div className="tactical-panel panel-cut inline-flex w-full items-center justify-between gap-4 rounded-[1rem] px-4 py-3 text-sm text-stone-300">
      <div className="flex items-center gap-3">
        <span className="signal-dot" />
        <div>
          <p className="section-label">Linked Wallet</p>
          <p className="mono mt-1 text-sm text-stone-200">{principal ? truncatePrincipal(principal, 8) : "No wallet"}</p>
        </div>
      </div>
      <span className="mono text-[11px] uppercase tracking-[0.24em] text-stone-500">{network}</span>
    </div>
  );
}
