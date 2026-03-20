import type { SubmittedTx } from "../types/tracker";

interface SubmittedTxNoticeProps {
  tx: SubmittedTx | null;
  label: string;
}

export function SubmittedTxNotice({ tx, label }: SubmittedTxNoticeProps) {
  if (!tx?.txid) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-teal/30 bg-teal/10 px-4 py-4 text-sm text-teal-100">
      <p className="font-medium">{label}</p>
      <p className="mt-2 break-all text-xs text-teal-200">{tx.txid}</p>
      {tx.explorerUrl ? (
        <a
          href={tx.explorerUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex text-xs font-semibold uppercase tracking-[0.18em] text-amber-200 transition hover:text-amber-100"
        >
          View On Explorer
        </a>
      ) : null}
    </div>
  );
}
