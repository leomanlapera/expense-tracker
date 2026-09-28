import { getSessionContext, getSupabaseServerClient } from "@/lib/supabase/server";
import { monthStart, todayInTimezone } from "@/lib/date";
import type { Category } from "@/lib/db-types";
import { NewCategoryForm } from "./new-category-form";
import { CategoryRow } from "./category-row";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EmptyState } from "@/components/ui/empty-state";

type SummaryRow = {
  category_id: string | null;
  category_name: string | null;
  category_color: string | null;
  type: "expense" | "income";
  total_minor: number;
};

export default async function CategoriesPage() {
  const [supabase, { timezone }] = await Promise.all([
    getSupabaseServerClient(),
    getSessionContext(),
  ]);

  const today = todayInTimezone(timezone);
  const monthAnchor = monthStart(today);

  const [{ data }, { data: summary }] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .order("archived", { ascending: true })
      .order("type", { ascending: true })
      .order("name", { ascending: true }),
    supabase.rpc("monthly_summary", { month_start: monthAnchor }),
  ]);

  const categories = (data as Category[] | null) ?? [];
  const totals = new Map<string, number>();
  for (const r of (summary as SummaryRow[] | null) ?? []) {
    if (r.category_id) totals.set(r.category_id, r.total_minor);
  }

  const active = categories.filter((c) => !c.archived);
  const archived = categories.filter((c) => c.archived);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
      <Breadcrumbs
        items={[{ label: "Home", href: "/dashboard" }, { label: "Categories" }]}
      />
      <PageHeader
        title="Categories"
        description="Rename or archive freely — archived ones stay linked to old transactions but disappear from pickers. Totals below are for this month."
      />

      <Card as="section">
        <CardHeader title="Add a category" />
        <NewCategoryForm />
      </Card>

      <section>
        <h2 className="mb-2 text-lg font-medium">Active ({active.length})</h2>
        {active.length === 0 ? (
          <EmptyState
            title="No active categories"
            description="Add one above. Ten defaults land automatically on your first sign-in."
          />
        ) : (
          <Card padding="none">
            <ul className="flex flex-col divide-y divide-[color:var(--color-border)]">
              {active.map((c) => (
                <CategoryRow key={c.id} category={c} monthTotal={totals.get(c.id) ?? 0} />
              ))}
            </ul>
          </Card>
        )}
      </section>

      {archived.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-medium">Archived ({archived.length})</h2>
          <Card padding="none">
            <ul className="flex flex-col divide-y divide-[color:var(--color-border)]">
              {archived.map((c) => (
                <CategoryRow key={c.id} category={c} monthTotal={totals.get(c.id) ?? 0} />
              ))}
            </ul>
          </Card>
        </section>
      )}
    </main>
  );
}
