import Link from "next/link";
import { getSessionContext, getSupabaseServerClient } from "@/lib/supabase/server";
import { formatMonth, monthStart, todayInTimezone } from "@/lib/date";
import { TransactionList } from "./transaction-list";
import { loadMoreTransactions } from "./load-more";
import { PAGE_SIZE, isSortKey } from "./list-types";
import { SortSelect } from "./sort-select";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Field, TextInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string;
    category?: string;
    q?: string;
    tag?: string;
    sort?: string;
    all?: string;
  }>;
}) {
  const sp = await searchParams;
  const { timezone } = await getSessionContext();
  const today = todayInTimezone(timezone);
  const monthAnchor = sp.month ? monthStart(`${sp.month}-01`) : monthStart(today);
  const sort = isSortKey(sp.sort) ? sp.sort : "date_desc";
  const allTime = sp.all === "1";
  const filtersActive = Boolean(sp.category || sp.q || sp.tag || sort !== "date_desc" || allTime);

  const [{ rows: initialRows, done }, { data: categoryList }] = await Promise.all([
    loadMoreTransactions({
      monthAnchor,
      category: sp.category,
      q: sp.q,
      tag: sp.tag,
      sort,
      allTime,
      offset: 0,
    }),
    (await getSupabaseServerClient()).from("categories").select("id,name").order("name"),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Transactions" },
        ]}
      />
      <PageHeader
        eyebrow={allTime ? "All time" : formatMonth(monthAnchor)}
        title="Transactions"
      />

      <PresetChips
        currentMonth={monthAnchor.slice(0, 7)}
        allTime={allTime}
        today={today}
        keepParams={{ category: sp.category, q: sp.q, tag: sp.tag, sort: sp.sort }}
      />

      <Card as="section">
        <form
          className="flex flex-col gap-4"
          role="search"
          aria-label="Filter transactions"
        >
          {/* Sort lives in its own toolbar below — keep the URL param on submit. */}
          <input type="hidden" name="sort" value={sort} />
          {allTime && <input type="hidden" name="all" value="1" />}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Month">
              <TextInput
                name="month"
                type="month"
                defaultValue={monthAnchor.slice(0, 7)}
                disabled={allTime}
              />
            </Field>
            <Field label="Category">
              <Select
                name="category"
                defaultValue={sp.category ?? ""}
                options={[
                  { value: "", label: "All categories" },
                  ...(categoryList ?? []).map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
            </Field>
            <Field label="Tag">
              <TextInput name="tag" placeholder="e.g. work" defaultValue={sp.tag ?? ""} />
            </Field>
            <Field label="Search">
              <TextInput
                name="q"
                type="search"
                placeholder="Notes, e.g. grocery"
                defaultValue={sp.q ?? ""}
              />
            </Field>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[color:var(--color-border)] pt-3">
            {filtersActive && (
              <Link
                href={`/transactions?${allTime ? "all=1" : `month=${monthAnchor.slice(0, 7)}`}`}
                className="inline-flex items-center rounded-md border border-[color:var(--color-border)] px-4 py-2 text-sm hover:bg-[color:var(--color-muted)]"
              >
                Clear
              </Link>
            )}
            <Button type="submit">Apply filters</Button>
          </div>
        </form>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[color:var(--color-muted-foreground)]">
          Page size {PAGE_SIZE}. Scroll for more.
        </p>
        <SortSelect value={sort} />
      </div>

      <TransactionList
        key={`${monthAnchor}|${sp.category ?? ""}|${sp.q ?? ""}|${sp.tag ?? ""}|${sort}|${allTime ? "1" : "0"}`}
        initialRows={initialRows}
        initialDone={done}
        query={{ monthAnchor, category: sp.category, q: sp.q, tag: sp.tag, sort, allTime }}
      />
    </main>
  );
}

function PresetChips({
  currentMonth,
  allTime,
  today,
  keepParams,
}: {
  currentMonth: string;
  allTime: boolean;
  today: string;
  keepParams: { category?: string; q?: string; tag?: string; sort?: string };
}) {
  const thisMonth = today.slice(0, 7);
  const [y, m] = thisMonth.split("-").map(Number);
  const prevY = m === 1 ? y - 1 : y;
  const prevM = m === 1 ? 12 : m - 1;
  const lastMonth = `${prevY}-${String(prevM).padStart(2, "0")}`;

  const isThis = !allTime && currentMonth === thisMonth;
  const isLast = !allTime && currentMonth === lastMonth;
  const isAll = allTime;

  const buildQs = (range: { month?: string; all?: "1" }) => {
    const p = new URLSearchParams();
    if (range.month) p.set("month", range.month);
    if (range.all) p.set("all", range.all);
    for (const [k, v] of Object.entries(keepParams)) {
      if (v) p.set(k, v);
    }
    return p.toString();
  };

  const presets: Array<{ label: string; href: string; active: boolean }> = [
    { label: "This month", href: `/transactions?${buildQs({ month: thisMonth })}`, active: isThis },
    { label: "Last month", href: `/transactions?${buildQs({ month: lastMonth })}`, active: isLast },
    { label: "All time", href: `/transactions?${buildQs({ all: "1" })}`, active: isAll },
  ];

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Range presets">
      {presets.map((p) => (
        <Link
          key={p.label}
          href={p.href}
          role="tab"
          aria-selected={p.active}
          className={`rounded-full border px-3 py-1 text-xs transition-colors ${
            p.active
              ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)] text-[color:var(--color-accent-foreground)]"
              : "border-[color:var(--color-border)] text-[color:var(--color-muted-foreground)] hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-foreground)]"
          }`}
        >
          {p.label}
        </Link>
      ))}
    </div>
  );
}
