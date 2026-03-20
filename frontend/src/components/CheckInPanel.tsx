import { useState } from "react";
import type { SubmittedTx, SnapshotRecord } from "../types/tracker";
import { InlineState } from "./InlineState";
import { SubmittedTxNotice } from "./SubmittedTxNotice";

interface CheckInPanelProps {
  snapshot: SnapshotRecord;
  isPending: boolean;
  onSubmit: (input: { note: string }) => Promise<SubmittedTx>;
  errorMessage?: string | null;
  lastSubmittedTx?: SubmittedTx | null;
}

export function CheckInPanel({
  snapshot,
  isPending,
  onSubmit,
  errorMessage,
  lastSubmittedTx
}: CheckInPanelProps) {
  const [note, setNote] = useState("");
  const [inlineError, setInlineError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!note.trim()) {
      setInlineError("Check-in note is required.");
      return;
    }

    setInlineError(null);
    await onSubmit({ note: note.trim() });
    setNote("");
  }

  return (
    <section className="glass rounded-[2rem] border border-white/10 p-6 shadow-panel">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Check In</p>
      <h2 className="mt-3 text-3xl font-semibold text-white">Anchor a new proof.</h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        Snapshot #{snapshot.id} is active until block <strong>u{snapshot.dueAtHeight}</strong>.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">Private proof note</span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={6}
            className="w-full rounded-3xl border border-white/10 bg-slate-950/60 px-4 py-4 text-sm text-white outline-none transition focus:border-teal"
            placeholder="I completed the habit and captured the proof off-chain."
          />
        </label>

        {inlineError ? <InlineState message={inlineError} tone="error" /> : null}
        {errorMessage ? <InlineState message={errorMessage} tone="error" /> : null}
        <SubmittedTxNotice tx={lastSubmittedTx ?? null} label="Check-in transaction submitted." />

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-3xl bg-teal px-5 py-4 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? "Submitting..." : "Check In"}
        </button>
      </form>
    </section>
  );
}
