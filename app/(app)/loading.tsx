export default function AppLoading() {
  return (
    <main
      className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 md:px-8 md:py-10"
      aria-busy
      aria-live="polite"
    >
      {/* PageHeader */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="h-3 w-28 animate-pulse rounded bg-[color:var(--color-muted)]" />
          <div className="h-8 w-48 animate-pulse rounded bg-[color:var(--color-muted)]" />
        </div>
        <div className="h-9 w-40 animate-pulse rounded-md bg-[color:var(--color-muted)]" />
      </div>

      {/* KPI trio */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-2 rounded-xl border border-[color:var(--color-border)] p-4"
          >
            <div className="h-3 w-16 animate-pulse rounded bg-[color:var(--color-muted)]" />
            <div className="h-7 w-28 animate-pulse rounded bg-[color:var(--color-muted)]" />
          </div>
        ))}
      </div>

      {/* Charts pair */}
      <div className="grid gap-6 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-4 rounded-xl border border-[color:var(--color-border)] p-6"
          >
            <div className="h-5 w-32 animate-pulse rounded bg-[color:var(--color-muted)]" />
            <div className="h-52 animate-pulse rounded-lg bg-[color:var(--color-muted)]" />
          </div>
        ))}
      </div>

      {/* Recent + Budgets band */}
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-xl border border-[color:var(--color-border)] p-6"
          >
            <div className="h-5 w-24 animate-pulse rounded bg-[color:var(--color-muted)]" />
            {[0, 1, 2, 3].map((j) => (
              <div
                key={j}
                className="h-6 w-full animate-pulse rounded bg-[color:var(--color-muted)]"
              />
            ))}
          </div>
        ))}
      </div>

      <span className="sr-only">Loading…</span>
    </main>
  );
}
