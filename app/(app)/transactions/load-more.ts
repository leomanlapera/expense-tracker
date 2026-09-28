"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { monthEndExclusive, monthStart } from "@/lib/date";
import { PAGE_SIZE, type SortKey, type TxnListRow } from "./list-types";

const SORT_MAP: Record<
  SortKey,
  { column: "occurred_on" | "amount_minor"; ascending: boolean }
> = {
  date_desc: { column: "occurred_on", ascending: false },
  date_asc: { column: "occurred_on", ascending: true },
  amount_desc: { column: "amount_minor", ascending: false },
  amount_asc: { column: "amount_minor", ascending: true },
};

export async function loadMoreTransactions(input: {
  monthAnchor: string;
  category?: string;
  q?: string;
  tag?: string;
  sort?: SortKey;
  allTime?: boolean;
  offset: number;
}): Promise<{ rows: TxnListRow[]; done: boolean }> {
  const supabase = await getSupabaseServerClient();

  const sort = SORT_MAP[input.sort ?? "date_desc"];

  let query = supabase
    .from("transactions")
    .select("*, categories:categories(id,name,icon,color)")
    .order(sort.column, { ascending: sort.ascending })
    .order("created_at", { ascending: false })
    .range(input.offset, input.offset + PAGE_SIZE - 1);

  if (!input.allTime) {
    const from = monthStart(input.monthAnchor);
    const to = monthEndExclusive(input.monthAnchor);
    query = query.gte("occurred_on", from).lt("occurred_on", to);
  }

  if (input.category) query = query.eq("category_id", input.category);
  if (input.q) query = query.ilike("note", `%${input.q}%`);
  if (input.tag) query = query.contains("tags", [input.tag.toLowerCase()]);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = (data as unknown as TxnListRow[] | null) ?? [];
  return { rows, done: rows.length < PAGE_SIZE };
}
