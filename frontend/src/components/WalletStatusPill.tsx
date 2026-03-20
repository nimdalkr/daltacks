import { truncatePrincipal } from "@daltacks/stx-utils";

interface WalletStatusPillProps {
  principal: string | null;
  network: string;
}

export function WalletStatusPill({ principal, network }: WalletStatusPillProps) {
  return (
    <div className="glass inline-flex items-center gap-3 rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300">
      <span className="h-2 w-2 rounded-full bg-gold" />
      <span>{principal ? truncatePrincipal(principal) : "No wallet"}</span>
      <span className="text-slate-500">·</span>
      <span className="uppercase tracking-[0.16em] text-slate-400">{network}</span>
    </div>
  );
}

