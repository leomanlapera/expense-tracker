import { getSessionContext, getSupabaseServerClient } from "@/lib/supabase/server";
import { formatMonth, monthStart, todayInTimezone } from "@/lib/date";
import type { Category } from "@/lib/db-types";
import { BudgetForm } from "./budget-form";
import { BudgetProgress } from "./budget-progress";
import { CopyFromPreviousButton } from "./copy-from-previous-button";
import { DeleteBudgetButton } from "./delete-budget-button";
import { MonthPicker } from "@/app/(app)/dashboard/month-picker";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EmptyState } from "@/components/ui/empty-state";

type BudgetStatus = {
  budget_id: string;
  category_id: string;
  category_name: string;
  category_color: string | null;
  limit_minor: number;
  spent_minor: number;
};

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const { timezone } = await getSessionContext();
  const today = todayInTimezone(timezone);
  const monthValue = sp.month ?? today.slice(0, 7);
  const monthAnchor = monthStart(`${monthValue}-01`);

  const supabase = await getSupabaseServerClient();

  const [{ data: statusRows }, { data: categories }] = await Promise.all([
    supabase.rpc("budget_status", { month_start: monthAnchor }),
    supabase.from("categories").select("*").eq("type", "expense").eq("archived", false).order("name"),
  ]);

  const budgets = (statusRows as BudgetStatus[] | null) ?? [];
  const expenseCats = (categories as Category[] | null) ?? [];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
      <Breadcrumbs
        items={[{ label: "Home", href: "/dashboard" }, { label: "Budgets" }]}
      />
      <PageHeader
        eyebrow={formatMonth(monthAnchor)}
        title="Budgets"
        description="One limit per category per month. You'll get an in-app warning at 80% and 100%."
        actions={<MonthPicker value={monthValue} base="/budgets" />}
      />

      <Card as="section">
        <CardHeader
          title="Set a monthly budget"
          subtitle="Saving twice for the same category updates the existing budget."
        />
        <BudgetForm categories={expenseCats} monthValue={monthValue} />
        <div className="mt-6 border-t border-[color:var(--color-border)] pt-4">
          <p className="mb-2 text-xs uppercase tracking-wide text-[color:var(--color-muted-foreground)]">
            Bulk
          </p>
          <CopyFromPreviousButton targetMonth={monthValue} />
        </div>
      </Card>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Progress this month</h2>
        {budgets.length === 0 ? (
          <EmptyState
            title="No budgets yet"
            description="Set a monthly limit above and it'll show up here."
          />
        ) : (
          <Card padding="none">
            <ul className="flex flex-col divide-y divide-[color:var(--color-border)]">
              {budgets.map((b) => (
                <li key={b.budget_id} className="flex flex-col gap-3 px-4 py-4">
                  <BudgetProgress
                    name={b.category_name}
                    color={b.category_color}
                    spent={b.spent_minor}
                    limit={b.limit_minor}
                  />
                  <div className="flex justify-end">
                    <DeleteBudgetButton id={b.budget_id} />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </main>
  );
}
