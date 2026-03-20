interface InlineStateProps {
  message: string;
  tone?: "loading" | "error" | "muted";
}

const toneMap = {
  loading: "border-teal/30 text-teal-200",
  error: "border-coral/30 text-rose-300",
  muted: "border-white/10 text-slate-400"
} as const;

export function InlineState({ message, tone = "muted" }: InlineStateProps) {
  return (
    <div className={`rounded-2xl border bg-slate-950/40 px-4 py-3 text-sm ${toneMap[tone]}`}>{message}</div>
  );
}

