interface InlineStateProps {
  message: string;
  tone?: "loading" | "error" | "muted";
}

const toneMap = {
  loading: "border-[rgba(249,115,22,0.3)] text-orange-200 bg-[rgba(249,115,22,0.08)]",
  error: "border-[rgba(251,113,133,0.3)] text-rose-200 bg-[rgba(127,29,29,0.12)]",
  muted: "border-[rgba(255,255,255,0.08)] text-stone-400 bg-[rgba(255,255,255,0.03)]"
} as const;

export function InlineState({ message, tone = "muted" }: InlineStateProps) {
  return (
    <div className={`panel-cut rounded-2xl border px-4 py-3 text-sm ${toneMap[tone]}`}>
      {message}
    </div>
  );
}
