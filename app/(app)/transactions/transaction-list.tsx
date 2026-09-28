"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatDayHeading, formatMonth } from "@/lib/date";
import { formatPhp } from "@/lib/money";
import { DeleteButton } from "./delete-button";
import { DuplicateButton } from "./duplicate-button";
import { loadMoreTransactions } from "./load-more";
import { PAGE_SIZE, type SortKey, type TxnListRow } from "./list-types";
import { EmptyState } from "@/components/ui/empty-state";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/validation/transaction";

type Query = {
  monthAnchor: string;
  category?: string;
  q?: string;
  tag?: string;
  sort?: SortKey;
  allTime?: boolean;
};

export function TransactionList({
  initialRows,
  initialDone,
  query,
}: {
  initialRows: TxnListRow[];
  initialDone: boolean;
  query: Query;
}) {
  const [rows, setRows] = useState<TxnListRow[]>(initialRows);
  const [done, setDone] = useState(initialDone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || done) return;
    setLoading(true);
    setError(null);
    try {
      const res = await loadMoreTransactions({ ...query, offset: rows.length });
      setRows((prev) => [...prev, ...res.rows]);
      setDone(res.done);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load more");
    } finally {
      setLoading(false);
    }
  }, [loading, done, query, rows.length]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || done) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore, done]);

  const groupByDay = query.sort === undefined || query.sort.startsWith("date");

  const grouped = useMemo(() => {
    if (!groupByDay) return null;
    const acc: Record<string, TxnListRow[]> = {};
    for (const r of rows) (acc[r.occurred_on] ??= []).push(r);
    return acc;
  }, [rows, groupByDay]);

  const days = useMemo(() => {
    if (!grouped) return [];
    const asc = query.sort === "date_asc";
    return Object.keys(grouped).sort((a, b) => (asc ? a.localeCompare(b) : b.localeCompare(a)));
  }, [grouped, query.sort]);

  if (rows.length === 0) {
    return query.allTime ? (
      <EmptyState
        title="No matching transactions"
        description="Try clearing filters, or search all time from the toggle above."
      />
    ) : (
      <EmptyState
        title="No transactions this month"
        description="Save one with the + button (or press N)."
      />
    );
  }

  const monthLabel = query.allTime ? "All time" : formatMonth(query.monthAnchor);

  return (
    <div className="flex flex-col gap-6">
      {groupByDay && grouped ? (
        days.map((day) => {
          const dayRows = grouped[day];
          const dayTotal = dayRows.reduce(
            (n, r) => n + (r.type === "expense" ? r.amount_minor : -r.amount_minor),
            0,
          );
          return (
            <section key={day} aria-labelledby={`day-${day}`}>
              <div className="mb-2 flex items-baseline justify-between text-xs uppercase tracking-wide text-[color:var(--color-muted-foreground)]">
                <h2 id={`day-${day}`}>{formatDayHeading(day)}</h2>
                <span className="tabular-nums">{formatPhp(dayTotal)}</span>
              </div>
              <ul className="flex flex-col divide-y divide-[color:var(--color-border)] rounded-xl border border-[color:var(--color-border)]">
                {dayRows.map((r) => (
                  <Row key={r.id} r={r} monthAnchor={query.monthAnchor} />
                ))}
              </ul>
            </section>
          );
        })
      ) : (
        <section aria-labelledby="sorted-list">
          <h2
            id="sorted-list"
            className="mb-2 text-xs uppercase tracking-wide text-[color:var(--color-muted-foreground)]"
          >
            {monthLabel} · sorted by amount
          </h2>
          <ul className="flex flex-col divide-y divide-[color:var(--color-border)] rounded-xl border border-[color:var(--color-border)]">
            {rows.map((r) => (
              <Row key={r.id} r={r} monthAnchor={query.monthAnchor} showDate />
            ))}
          </ul>
        </section>
      )}

      <div ref={sentinelRef} aria-hidden className="h-8" />
      {loading && (
        <p className="text-center text-sm text-[color:var(--color-muted-foreground)]">Loading…</p>
      )}
      {done && rows.length > PAGE_SIZE && (
        <p className="text-center text-xs text-[color:var(--color-muted-foreground)]">
          End of {rows.length} transactions
        </p>
      )}
      {error && (
        <p role="alert" className="text-center text-sm text-[color:var(--color-budget-over)]">
          {error}
        </p>
      )}
    </div>
  );
}

function Row({
  r,
  monthAnchor,
  showDate = false,
}: {
  r: TxnListRow;
  monthAnchor: string;
  showDate?: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-[color:var(--color-muted)]">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {r.categories?.name ?? "Uncategorised"}
          {r.note && (
            <span className="ml-2 text-[color:var(--color-muted-foreground)]">{r.note}</span>
          )}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[color:var(--color-muted-foreground)]">
          {showDate && <span className="tabular-nums">{r.occurred_on.slice(5)}</span>}
          {r.payment_method && (
            <span className="tracking-wide">
              {PAYMENT_METHOD_LABELS[r.payment_method as PaymentMethod] ?? r.payment_method}
            </span>
          )}
          {r.receipt_path && (
            <a
              href={`/api/receipts/${r.receipt_path}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-[color:var(--color-border)] px-1.5 py-0.5 hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-foreground)]"
              title="View receipt"
            >
              receipt
            </a>
          )}
          {r.tags.map((t) => (
            <Link
              key={t}
              href={`/transactions?month=${monthAnchor.slice(0, 7)}&tag=${encodeURIComponent(t)}`}
              className="rounded-full border border-[color:var(--color-border)] px-1.5 py-0.5 hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-foreground)]"
            >
              #{t}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`tabular-nums font-medium ${
            r.type === "income" ? "text-[color:var(--color-budget-ok)]" : ""
          }`}
        >
          {r.type === "income" ? "+" : "−"}
          {formatPhp(r.amount_minor)}
        </span>
        <DuplicateButton id={r.id} />
        <Link
          href={`/transactions/${r.id}/edit`}
          className="rounded-md border border-[color:var(--color-border)] px-2 py-1 text-xs text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)]"
        >
          Edit
        </Link>
        <DeleteButton id={r.id} />
      </div>
    </li>
  );
}
