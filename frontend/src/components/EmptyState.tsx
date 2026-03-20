interface EmptyStateProps {
  title: string;
  body: string;
}

export function EmptyState({ title, body }: EmptyStateProps) {
  return (
    <section className="tactical-empty panel-cut rounded-[1.8rem] p-8 text-left">
      <p className="section-label">Standby State</p>
      <h2 className="mt-4 text-3xl font-semibold uppercase tracking-[-0.03em] text-stone-100">{title}</h2>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-400">{body}</p>
    </section>
  );
}
