import { useState } from "react";
import type { BuilderBadge, BuilderProfile, SubmittedTx } from "../types/tracker";
import { InlineState } from "./InlineState";
import { SubmittedTxNotice } from "./SubmittedTxNotice";

interface BuilderProfilePanelProps {
  profile: BuilderProfile | null;
  badges: BuilderBadge[];
  publishPending: boolean;
  claimPendingBadgeId: number | null;
  publishError?: string | null;
  claimError?: string | null;
  publishTx?: SubmittedTx | null;
  claimTx?: SubmittedTx | null;
  onPublishProfile: (input: { displayName: string; tagline: string }) => Promise<unknown>;
  onClaimBadge: (input: { badgeId: number }) => Promise<unknown>;
}

export function BuilderProfilePanel({
  profile,
  badges,
  publishPending,
  claimPendingBadgeId,
  publishError,
  claimError,
  publishTx,
  claimTx,
  onPublishProfile,
  onClaimBadge
}: BuilderProfilePanelProps) {
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "Builder");
  const [tagline, setTagline] = useState(profile?.tagline ?? "Tracking real mainnet work through DALTACKS.");
  const [inlineError, setInlineError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!displayName.trim() || !tagline.trim()) {
      setInlineError("Display name and tagline are required.");
      return;
    }

    setInlineError(null);
    await onPublishProfile({
      displayName: displayName.trim(),
      tagline: tagline.trim()
    });
  }

  return (
    <section className="tactical-panel panel-cut rounded-[1.9rem] p-5 md:p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="section-label">Builder Profile</p>
          <h2 className="mt-3 text-2xl font-semibold uppercase tracking-[-0.03em] text-stone-100">
            Public Mission Identity
          </h2>
        </div>
        <p className="mono text-[11px] uppercase tracking-[0.2em] text-stone-500">
          {profile ? `Published @ u${profile.publishedAtHeight}` : "Unpublished"}
        </p>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm uppercase tracking-[0.08em] text-stone-400">Display Name</span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="w-full rounded-[1.35rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(14,14,14,0.7)] px-4 py-4 text-sm text-stone-100 outline-none transition focus:border-[rgba(255,123,0,0.5)]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm uppercase tracking-[0.08em] text-stone-400">Tagline</span>
            <textarea
              value={tagline}
              onChange={(event) => setTagline(event.target.value)}
              rows={4}
              className="w-full rounded-[1.35rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(14,14,14,0.7)] px-4 py-4 text-sm text-stone-100 outline-none transition focus:border-[rgba(255,123,0,0.5)]"
            />
          </label>

          {inlineError ? <InlineState message={inlineError} tone="error" /> : null}
          {publishError ? <InlineState message={publishError} tone="error" /> : null}
          <SubmittedTxNotice tx={publishTx ?? null} label="Profile publish submitted." />

          <button
            type="submit"
            disabled={publishPending}
            className="w-full rounded-[1.35rem] border border-[rgba(255,123,0,0.28)] px-5 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-orange-200 transition hover:bg-[rgba(255,123,0,0.08)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {publishPending ? "Publishing..." : profile ? "Refresh Profile Onchain" : "Publish Builder Profile"}
          </button>
        </form>

        <div className="space-y-3">
          <p className="section-label">Claimable Badges</p>
          {badges.map((badge) => (
            <article key={badge.badgeId} className="metric-card panel-cut rounded-[1.35rem] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.03em] text-stone-100">{badge.label}</p>
                  <p className="mt-2 text-sm text-stone-400">
                    {badge.isClaimed ? "Already anchored onchain." : "Claim when your mission stats unlock it."}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={badge.isClaimed || claimPendingBadgeId === badge.badgeId}
                  onClick={() => void onClaimBadge({ badgeId: badge.badgeId })}
                  className="rounded-full border border-[rgba(255,255,255,0.12)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-100 transition hover:border-[rgba(255,123,0,0.34)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {badge.isClaimed ? "Claimed" : claimPendingBadgeId === badge.badgeId ? "Claiming..." : "Claim"}
                </button>
              </div>
            </article>
          ))}

          {claimError ? <InlineState message={claimError} tone="error" /> : null}
          <SubmittedTxNotice tx={claimTx ?? null} label="Badge claim submitted." />
        </div>
      </div>
    </section>
  );
}
