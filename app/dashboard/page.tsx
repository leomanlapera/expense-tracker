export default function DashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-1">
        <p className="text-sm text-[color:var(--color-muted-foreground)]">September 2026</p>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
      </header>

      <section className="rounded-xl border border-[color:var(--color-border)] p-6">
        <p className="text-sm text-[color:var(--color-muted-foreground)]">Spent this month</p>
        <p className="mt-2 text-4xl font-semibold tabular-nums">₱0.00</p>
      </section>

      <section className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-[color:var(--color-border)] p-4">
          <p className="text-xs uppercase tracking-wide text-[color:var(--color-muted-foreground)]">
            Income
          </p>
          <p className="mt-1 text-xl font-medium tabular-nums">₱0.00</p>
        </div>
        <div className="rounded-xl border border-[color:var(--color-border)] p-4">
          <p className="text-xs uppercase tracking-wide text-[color:var(--color-muted-foreground)]">
            Remaining
          </p>
          <p className="mt-1 text-xl font-medium tabular-nums">₱0.00</p>
        </div>
      </section>

      <section className="rounded-xl border border-dashed border-[color:var(--color-border)] p-8 text-center text-sm text-[color:var(--color-muted-foreground)]">
        No expenses yet. Add your first one to see the breakdown.
      </section>
    </main>
  );
}
