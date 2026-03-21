import { useState } from "react";
import type { BuilderStats, MissionRecord, SubmittedTx } from "../types/tracker";
import { InlineState } from "./InlineState";
import { SubmittedTxNotice } from "./SubmittedTxNotice";

interface MissionCommandPanelProps {
  mission: MissionRecord | null;
  stats: BuilderStats;
  createMissionPending: boolean;
  checkInPending: boolean;
  completePending: boolean;
  createMissionError?: string | null;
  checkInError?: string | null;
  completeError?: string | null;
  createMissionTx?: SubmittedTx | null;
  checkInTx?: SubmittedTx | null;
  completeMissionTx?: SubmittedTx | null;
  onCreateMission: (input: { missionLabel: string; objective: string; durationDays: number }) => Promise<unknown>;
  onCheckIn: (input: { note: string }) => Promise<unknown>;
  onCompleteMission: () => Promise<unknown>;
}

export function MissionCommandPanel({
  mission,
  stats,
  createMissionPending,
  checkInPending,
  completePending,
  createMissionError,
  checkInError,
  completeError,
  createMissionTx,
  checkInTx,
  completeMissionTx,
  onCreateMission,
  onCheckIn,
  onCompleteMission
}: MissionCommandPanelProps) {
  const [missionLabel, setMissionLabel] = useState("Mainnet Builder Run");
  const [objective, setObjective] = useState("");
  const [durationDays, setDurationDays] = useState(7);
  const [note, setNote] = useState("");
  const [inlineError, setInlineError] = useState<string | null>(null);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!missionLabel.trim() || !objective.trim()) {
      setInlineError("Mission label and objective are required.");
      return;
    }

    setInlineError(null);
    await onCreateMission({
      missionLabel: missionLabel.trim(),
      objective: objective.trim(),
      durationDays
    });
    setObjective("");
  }

  async function handleCheckIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!note.trim()) {
      setInlineError("Check-in note is required.");
      return;
    }

    setInlineError(null);
    await onCheckIn({ note: note.trim() });
    setNote("");
  }

  return (
    <section className="tactical-panel panel-cut p-5 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="section-label">Mission Control</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-stone-100">
            Builder Mission Loop
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-400">
            Start a mission, anchor recurring proof on mainnet, then complete and claim the resulting signal.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Metric label="Missions Created" value={String(stats.totalMissionsCreated)} />
          <Metric label="Check-ins Logged" value={String(stats.totalCheckIns)} />
        </div>
      </div>

      {mission ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="metric-card panel-cut p-4">
              <p className="section-label">Active Mission</p>
              <h3 className="mt-3 text-xl font-semibold tracking-[-0.02em] text-stone-100">
                {mission.missionLabel}
              </h3>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <Metric label="Mission ID" value={`#${mission.id}`} />
                <Metric label="Due Height" value={`u${mission.dueAtHeight}`} />
                <Metric label="Status" value={mission.status} />
              </div>
            </div>

            <form onSubmit={handleCheckIn} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-300">Proof Note</span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={5}
                  className="ui-textarea px-4 py-4 text-sm"
                  placeholder="Describe the work, deployment, or protocol usage you just completed."
                />
              </label>

              {inlineError ? <InlineState message={inlineError} tone="error" /> : null}
              {checkInError ? <InlineState message={checkInError} tone="error" /> : null}
              <SubmittedTxNotice tx={checkInTx ?? null} label="Check-in transaction submitted." />

              <div className="flex flex-col gap-3 md:flex-row">
                <button
                  type="submit"
                  disabled={checkInPending}
                  className="ui-primary-button flex-1 px-5 py-4 text-sm"
                >
                  {checkInPending ? "Anchoring..." : "Anchor Check-in"}
                </button>

                <button
                  type="button"
                  onClick={() => void onCompleteMission()}
                  disabled={completePending || mission.checkInCount < 3}
                  className="ui-ghost-button flex-1 px-5 py-4 text-sm"
                >
                  {completePending ? "Completing..." : "Complete Mission"}
                </button>
              </div>
            </form>

            {completeError ? <InlineState message={completeError} tone="error" /> : null}
            <SubmittedTxNotice tx={completeMissionTx ?? null} label="Mission completion submitted." />
          </div>

          <div className="metric-card panel-cut p-4">
            <p className="section-label">Mission Rules</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-stone-300">
              <li>At least 3 check-ins are required before a mission can be completed.</li>
              <li>Each check-in is a mainnet write and strengthens your proof history.</li>
              <li>Use the note field for evidence that matches actual mainnet behavior.</li>
            </ul>
          </div>
        </div>
      ) : (
        <form onSubmit={handleCreate} className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-300">Mission Label</span>
              <input
                value={missionLabel}
                onChange={(event) => setMissionLabel(event.target.value)}
                className="ui-input px-4 py-4 text-sm"
                placeholder="Mainnet Builder Run"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-300">Objective</span>
              <textarea
                value={objective}
                onChange={(event) => setObjective(event.target.value)}
                rows={5}
                className="ui-textarea px-4 py-4 text-sm"
                placeholder="Deploy, use, and document meaningful mainnet work through DALTACKS."
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-300">Duration (days)</span>
              <input
                type="number"
                min={1}
                value={durationDays}
                onChange={(event) => setDurationDays(Number(event.target.value))}
                className="ui-number px-4 py-4 text-sm"
              />
            </label>

            {inlineError ? <InlineState message={inlineError} tone="error" /> : null}
            {createMissionError ? <InlineState message={createMissionError} tone="error" /> : null}
            <SubmittedTxNotice tx={createMissionTx ?? null} label="Mission creation submitted." />

            <button
              type="submit"
              disabled={createMissionPending}
              className="ui-primary-button w-full px-5 py-4 text-sm"
            >
              {createMissionPending ? "Creating..." : "Start Mission"}
            </button>
          </div>

          <div className="metric-card panel-cut p-4">
            <p className="section-label">Why This Matters</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-stone-300">
              <li>Mission start creates a clear mainnet action tied to your builder run.</li>
              <li>Check-ins create recurring proof instead of shallow one-off activity.</li>
              <li>Completion and badge claims convert activity into public builder evidence.</li>
            </ul>
          </div>
        </form>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card panel-cut px-4 py-3 text-right">
      <p className="section-label">{label}</p>
      <p className="mono mt-3 text-xl font-semibold text-stone-100">{value}</p>
    </div>
  );
}
