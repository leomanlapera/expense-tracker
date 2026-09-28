"use client";

import { useEffect, useState } from "react";
import { formatPhp } from "@/lib/money";
import { subscribeTxnCreated, type TxnCreatedRow } from "@/lib/tx-bus";

export type RecentRow = {
  id: string;
  type: "expense" | "income";
  amount_minor: number;
  occurred_on: string;
  note: string | null;
  category: { name: string | null; color: string | null } | null;
};

export function Recent({ initial }: { initial: RecentRow[] }) {
  // Ghost rows bridge the ~200-500ms between the server confirming an insert
  // and revalidatePath's RSC refetch landing. Once a ghost's id shows up in
  // `initial` from the refetch, the merge drops it.
  const [ghosts, setGhosts] = useState<RecentRow[]>([]);

  useEffect(() => {
    return subscribeTxnCreated((row: TxnCreatedRow) => {
      const normalized: RecentRow = { ...row };
      setGhosts((prev) =>
        prev.some((g) => g.id === normalized.id) ? prev : [normalized, ...prev],
      );
    });
  }, []);

  useEffect(() => {
    if (ghosts.length === 0) return;
    const seen = new Set(initial.map((r) => r.id));
    setGhosts((prev) => {
      const next = prev.filter((g) => !seen.has(g.id));
      return next.length === prev.length ? prev : next;
    });
  }, [initial, ghosts.length]);

  const rows = mergeById(ghosts, initial).slice(0, 5);
  const ghostIds = new Set(ghosts.map((g) => g.id));

  return (
    <ul className="flex flex-col divide-y divide-[color:var(--color-border)]">
      {rows.map((r) => (
        <li
          key={r.id}
          className={`flex items-center justify-between gap-3 py-2 text-sm ${
            ghostIds.has(r.id) ? "app-fade-in" : ""
          }`}
        >
          <div className="flex min-w-0 items-center gap-2">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full border border-[color:var(--color-border)]"
              style={{ background: r.category?.color ?? "transparent" }}
            />
            <span className="truncate">
              <span className="font-medium">{r.category?.name ?? "Uncategorised"}</span>
              {r.note && (
                <span className="ml-2 text-[color:var(--color-muted-foreground)]">
                  {r.note}
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[color:var(--color-muted-foreground)]">
              {r.occurred_on.slice(5)}
            </span>
            <span
              className={`tabular-nums ${
                r.type === "income" ? "text-[color:var(--color-budget-ok)]" : ""
              }`}
            >
              {r.type === "income" ? "+" : "−"}
              {formatPhp(r.amount_minor)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function mergeById(ghosts: RecentRow[], initial: RecentRow[]): RecentRow[] {
  if (ghosts.length === 0) return initial;
  const seen = new Set(initial.map((r) => r.id));
  const fresh = ghosts.filter((g) => !seen.has(g.id));
  return fresh.length > 0 ? [...fresh, ...initial] : initial;
}
