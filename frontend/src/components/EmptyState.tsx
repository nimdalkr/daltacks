interface EmptyStateProps {
  title: string;
  body: string;
}

export function EmptyState({ title, body }: EmptyStateProps) {
  return (
    <section className="glass rounded-[2rem] border border-dashed border-white/10 p-8 text-center shadow-panel">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Empty State</p>
      <h2 className="mt-3 text-3xl font-semibold text-white">{title}</h2>
      <p className="mt-4 text-sm leading-6 text-slate-300">{body}</p>
    </section>
  );
}

