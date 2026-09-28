import { getSessionContext, getSupabaseServerClient } from "@/lib/supabase/server";
import { todayInTimezone } from "@/lib/date";
import { formatPhp } from "@/lib/money";
import type { Category, RecurringRule } from "@/lib/db-types";
import { NewRecurringForm } from "./new-recurring-form";
import { DeleteRule, ToggleActive } from "./rule-controls";
import { RunNowButton } from "./run-now-button";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EmptyState } from "@/components/ui/empty-state";

type RuleRow = RecurringRule & {
  categories: { name: string | null; color: string | null } | null;
};

export default async function RecurringPage() {
  const [supabase, { timezone }] = await Promise.all([
    getSupabaseServerClient(),
    getSessionContext(),
  ]);

  const today = todayInTimezone(timezone);

  const [{ data: rulesData }, { data: categoriesData }] = await Promise.all([
    supabase
      .from("recurring_rules")
      .select("*, categories:categories(name,color)")
      .order("active", { ascending: false })
      .order("next_run_on", { ascending: true }),
    supabase
      .from("categories")
      .select("*")
      .eq("archived", false)
      .order("type", { ascending: true })
      .order("name", { ascending: true }),
  ]);

  const rules = (rulesData as unknown as RuleRow[] | null) ?? [];
  const categories = (categoriesData as Category[] | null) ?? [];
  const dueCount = rules.filter((r) => r.active && r.next_run_on <= today).length;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
      <Breadcrumbs
        items={[{ label: "Home", href: "/dashboard" }, { label: "Recurring" }]}
      />
      <PageHeader
        title="Recurring"
        description="Auto-generate a transaction on a schedule. Runs on demand for now — an automated daily job comes later."
        actions={<RunNowButton />}
      />

      {dueCount > 0 && (
        <Card tone="warn" padding="tight">
          <p role="status" className="text-sm">
            {dueCount} rule{dueCount === 1 ? " is" : "s are"} due. Click{" "}
            <em>Run due now</em> to log them.
          </p>
        </Card>
      )}

      <Card as="section">
        <CardHeader title="Add a rule" />
        <NewRecurringForm categories={categories} defaultDate={today} />
      </Card>

      <section>
        <h2 className="mb-2 text-lg font-medium">Rules ({rules.length})</h2>
        {rules.length === 0 ? (
          <EmptyState
            title="No recurring rules"
            description="Set one above — Weekly, Monthly, or custom — and it'll auto-run when due."
          />
        ) : (
          <Card padding="none">
            <ul className="flex flex-col divide-y divide-[color:var(--color-border)]">
              {rules.map((r) => {
                const overdue = r.active && r.next_run_on <= today;
                return (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 truncate text-sm font-medium">
                        {r.categories?.color && (
                          <span
                            aria-hidden
                            className="size-2.5 rounded-full"
                            style={{ background: r.categories.color }}
                          />
                        )}
                        <span>{r.categories?.name ?? "Uncategorised"}</span>
                        {r.note && (
                          <span className="text-[color:var(--color-muted-foreground)]">
                            {r.note}
                          </span>
                        )}
                        {!r.active && (
                          <span className="rounded-full border border-[color:var(--color-border)] px-1.5 py-0.5 text-xs uppercase tracking-wide text-[color:var(--color-muted-foreground)]">
                            paused
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-[color:var(--color-muted-foreground)]">
                        {r.interval} · next {r.next_run_on}
                        {overdue && (
                          <span className="ml-2 text-[color:var(--color-budget-warn)]">due</span>
                        )}
                      </p>
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
                      <ToggleActive id={r.id} active={r.active} />
                      <DeleteRule id={r.id} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </section>
    </main>
  );
}
