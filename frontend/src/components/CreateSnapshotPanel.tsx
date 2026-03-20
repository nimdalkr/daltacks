import { useState } from "react";
import type { SubmittedTx } from "../types/tracker";
import { InlineState } from "./InlineState";
import { SubmittedTxNotice } from "./SubmittedTxNotice";

interface CreateSnapshotPanelProps {
  isPending: boolean;
  onSubmit: (input: { objective: string; durationDays: number }) => Promise<SubmittedTx>;
  errorMessage?: string | null;
  lastSubmittedTx?: SubmittedTx | null;
}

export function CreateSnapshotPanel({
  isPending,
  onSubmit,
  errorMessage,
  lastSubmittedTx
}: CreateSnapshotPanelProps) {
  const [objective, setObjective] = useState("");
  const [durationDays, setDurationDays] = useState(7);
  const [inlineError, setInlineError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!objective.trim()) {
      setInlineError("Objective is required.");
      return;
    }

    if (durationDays <= 0) {
      setInlineError("Duration must be positive.");
      return;
    }

    setInlineError(null);
    await onSubmit({ objective: objective.trim(), durationDays });
    setObjective("");
  }

  return (
    <section className="glass rounded-[2rem] border border-white/10 p-6 shadow-panel">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Create Snapshot</p>
      <h2 className="mt-3 text-3xl font-semibold text-white">Start one commitment.</h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        Your objective is hashed locally in the browser. The contract stores only the hash and the deadline block.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">Objective</span>
          <textarea
            value={objective}
            onChange={(event) => setObjective(event.target.value)}
            rows={5}
            className="w-full rounded-3xl border border-white/10 bg-slate-950/60 px-4 py-4 text-sm text-white outline-none transition focus:border-teal"
            placeholder="I will finish my daily review before sleep."
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">Duration (days)</span>
          <input
            type="number"
            min={1}
            value={durationDays}
            onChange={(event) => setDurationDays(Number(event.target.value))}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-gold"
          />
        </label>

        {inlineError ? <InlineState message={inlineError} tone="error" /> : null}
        {errorMessage ? <InlineState message={errorMessage} tone="error" /> : null}
        <SubmittedTxNotice tx={lastSubmittedTx ?? null} label="Snapshot transaction submitted." />

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-3xl bg-gradient-to-r from-gold to-amber-300 px-5 py-4 text-sm font-semibold text-ink transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? "Creating..." : "Create Snapshot"}
        </button>
      </form>
    </section>
  );
}
