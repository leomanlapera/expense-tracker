import Link from "next/link";
import dynamic from "next/dynamic";
import { getSessionContext, getSupabaseServerClient } from "@/lib/supabase/server";
import { formatPhp } from "@/lib/money";
import { formatMonth, monthStart, todayInTimezone } from "@/lib/date";
import type { CategorySlice } from "./category-donut";
import type { DailyPoint } from "./daily-trend";
import { BudgetProgress } from "@/app/(app)/budgets/budget-progress";
import { MonthPicker } from "./month-picker";
import { Recent, type RecentRow } from "./recent";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

const CategoryDonut = dynamic(
  () => import("./category-donut").then((m) => m.CategoryDonut),
  { loading: () => <ChartSkeleton height="h-52" /> },
);
const DailyTrend = dynamic(
  () => import("./daily-trend").then((m) => m.DailyTrend),
  { loading: () => <ChartSkeleton height="h-48" /> },
);

function ChartSkeleton({ height }: { height: string }) {
  return (
    <div
      className={`w-full animate-pulse rounded-lg bg-[color:var(--color-muted)] ${height}`}
      aria-hidden
    />
  );
}

type SummaryRow = CategorySlice & { type: "expense" | "income" };
type BudgetStatus = {
  budget_id: string;
  category_id: string;
  category_name: string;
  category_color: string | null;
  limit_minor: number;
  spent_minor: number;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const [supabase, { timezone }] = await Promise.all([
    getSupabaseServerClient(),
    getSessionContext(),
  ]);

  const today = todayInTimezone(timezone);
  const monthAnchor = sp.month ? monthStart(`${sp.month}-01`) : monthStart(today);
  const isCurrentMonth = monthAnchor === monthStart(today);

  const [
    { data: summary },
    { data: daily },
    { data: budgets },
    { data: recentRows },
  ] = await Promise.all([
    supabase.rpc("monthly_summary", { month_start: monthAnchor }),
    supabase.rpc("daily_totals", { month_start: monthAnchor }),
    supabase.rpc("budget_status", { month_start: monthAnchor }),
    supabase
      .from("transactions")
      .select("id,type,amount_minor,occurred_on,note,categories:categories(name,color)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  type RawRecent = {
    id: string;
    type: "expense" | "income";
    amount_minor: number;
    occurred_on: string;
    note: string | null;
    categories: { name: string | null; color: string | null } | { name: string | null; color: string | null }[] | null;
  };
  const rawRecent = (recentRows as unknown as RawRecent[] | null) ?? [];
  const recent: RecentRow[] = rawRecent.map((r) => {
    const c = Array.isArray(r.categories) ? (r.categories[0] ?? null) : r.categories;
    return {
      id: r.id,
      type: r.type,
      amount_minor: r.amount_minor,
      occurred_on: r.occurred_on,
      note: r.note,
      category: c ? { name: c.name, color: c.color } : null,
    };
  });

  const summaryRows = (summary as SummaryRow[] | null) ?? [];
  const expenseSlices = summaryRows.filter((r) => r.type === "expense");
  const totals = summaryRows.reduce(
    (acc, r) => {
      if (r.type === "expense") acc.expense += r.total_minor;
      else acc.income += r.total_minor;
      return acc;
    },
    { expense: 0, income: 0 },
  );
  const remaining = totals.income - totals.expense;

  const budgetRows = (budgets as BudgetStatus[] | null) ?? [];
  const alerts = budgetRows.filter((b) => b.limit_minor > 0 && b.spent_minor / b.limit_minor >= 0.8);

  const dailyPoints = (daily as DailyPoint[] | null) ?? [];
  const isEmptyMonth = summaryRows.length === 0;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/dashboard" }, { label: "Dashboard" }]} />
      <PageHeader
        eyebrow={formatMonth(monthAnchor)}
        title="Dashboard"
        actions={
          <>
            <MonthPicker value={monthAnchor.slice(0, 7)} base="/dashboard" />
            {!isCurrentMonth && (
              <Link href="/dashboard" className="text-xs underline">
                This month
              </Link>
            )}
          </>
        }
      />

      {isEmptyMonth && isCurrentMonth && (
        <Card tone="muted">
          <h2 className="text-lg font-medium">Welcome. Log your first expense below.</h2>
          <p className="mt-1 text-sm text-[color:var(--color-muted-foreground)]">
            Ten default categories are ready. Rename or add your own on the{" "}
            <Link href="/categories" className="underline">
              Categories
            </Link>{" "}
            page. Set a monthly budget on the{" "}
            <Link href="/budgets" className="underline">
              Budgets
            </Link>{" "}
            page and you&rsquo;ll get warned at 80% and 100%.
          </p>
        </Card>
      )}

      {alerts.length > 0 && (
        <Card tone="warn" padding="tight" as="section">
          <div role="alert" className="text-sm">
            <p className="font-medium">
              {alerts.length} budget{alerts.length > 1 ? "s" : ""} need attention
            </p>
            <ul className="mt-2 flex flex-col gap-1">
              {alerts.map((a) => {
                const pct = Math.round((a.spent_minor / a.limit_minor) * 100);
                return (
                  <li key={a.budget_id} className="flex justify-between tabular-nums">
                    <span>{a.category_name}</span>
                    <span
                      className={
                        pct >= 100
                          ? "text-[color:var(--color-budget-over)]"
                          : "text-[color:var(--color-budget-warn)]"
                      }
                    >
                      {pct}% used
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </Card>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Spent" value={formatPhp(totals.expense)} />
        <Kpi label="Income" value={formatPhp(totals.income)} />
        <Kpi
          label="Remaining"
          value={formatPhp(remaining)}
          tone={remaining < 0 ? "over" : "default"}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Spend by category" />
          <CategoryDonut data={expenseSlices} />
        </Card>
        <Card>
          <CardHeader title="Daily trend" />
          <DailyTrend data={dailyPoints} />
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Card>
          <CardHeader title="Recent" />
          {recent.length > 0 ? (
            <Recent initial={recent} />
          ) : (
            <p className="text-sm text-[color:var(--color-muted-foreground)]">
              No transactions yet — hit <kbd className="rounded border border-[color:var(--color-border)] px-1 text-xs">n</kbd> or the + button to add one.
            </p>
          )}
        </Card>

        {budgetRows.length > 0 ? (
          <Card>
            <CardHeader title="Budgets" />
            <ul className="flex flex-col gap-4">
              {budgetRows.map((b) => (
                <li key={b.budget_id}>
                  <BudgetProgress
                    name={b.category_name}
                    color={b.category_color}
                    spent={b.spent_minor}
                    limit={b.limit_minor}
                  />
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <Card tone="muted">
            <p className="text-sm text-[color:var(--color-muted-foreground)]">
              No budgets set.{" "}
              <Link href="/budgets" className="underline">
                Add one
              </Link>{" "}
              to see progress here.
            </p>
          </Card>
        )}
      </section>

    </main>
  );
}

function Kpi({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "over";
}) {
  return (
    <Card padding="tight">
      <p className="text-xs uppercase tracking-wide text-[color:var(--color-muted-foreground)]">
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-semibold tabular-nums ${
          tone === "over" ? "text-[color:var(--color-budget-over)]" : ""
        }`}
      >
        {value}
      </p>
    </Card>
  );
}
