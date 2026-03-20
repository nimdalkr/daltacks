interface InlineStateProps {
  message: string;
  tone?: "loading" | "error" | "muted";
}

const toneMap = {
  loading: "border-[rgba(255,123,0,0.42)] text-orange-200 bg-[rgba(255,123,0,0.08)]",
  error: "border-[rgba(239,68,68,0.4)] text-rose-300 bg-[rgba(127,29,29,0.16)]",
  muted: "border-[rgba(255,255,255,0.12)] text-stone-400 bg-[rgba(255,255,255,0.03)]"
} as const;

export function InlineState({ message, tone = "muted" }: InlineStateProps) {
  return (
    <div className={`panel-cut rounded-[1rem] border px-4 py-3 text-sm uppercase tracking-[0.08em] ${toneMap[tone]}`}>
      {message}
    </div>
  );
}
