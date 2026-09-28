import { formatPhp } from "@/lib/money";

export function BudgetProgress({
  name,
  color,
  spent,
  limit,
}: {
  name: string;
  color?: string | null;
  spent: number;
  limit: number;
}) {
  const rawPct = limit === 0 ? 0 : Math.round((spent / limit) * 100);
  const pct = Math.min(200, rawPct);
  const status: "ok" | "warn" | "over" = pct >= 100 ? "over" : pct >= 80 ? "warn" : "ok";
  const trackVar =
    status === "over"
      ? "var(--color-budget-over)"
      : status === "warn"
        ? "var(--color-budget-warn)"
        : "var(--color-budget-ok)";
  const overBy = spent - limit;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 truncate">
          {color && <span aria-hidden className="size-2.5 rounded-full" style={{ background: color }} />}
          <span className="truncate font-medium">{name}</span>
        </div>
        <div className="flex items-baseline gap-2 tabular-nums">
          <span className={status === "over" ? "text-[color:var(--color-budget-over)]" : ""}>
            {formatPhp(spent)}
          </span>
          <span className="text-xs text-[color:var(--color-muted-foreground)]">
            / {formatPhp(limit)}
          </span>
        </div>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(100, pct)}
        aria-label={
          status === "over"
            ? `${name} budget: over by ${formatPhp(overBy)}`
            : `${name} budget: ${pct}% used`
        }
        className="h-2 overflow-hidden rounded-full bg-[color:var(--color-muted)]"
      >
        <div
          className="h-full rounded-full transition-[width]"
          style={{ width: `${Math.min(100, pct)}%`, background: trackVar }}
        />
      </div>
      <p className="text-xs text-[color:var(--color-muted-foreground)]">
        {status === "over" ? (
          <>
            <span className="text-[color:var(--color-budget-over)]">
              Over by {formatPhp(overBy)}
            </span>
            {" · "}
            {pct}% of limit
          </>
        ) : status === "warn" ? (
          <>{pct}% used · nearing limit</>
        ) : (
          <>{pct}% used</>
        )}
      </p>
    </div>
  );
}
