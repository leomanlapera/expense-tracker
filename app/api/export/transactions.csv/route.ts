import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type Row = {
  occurred_on: string;
  type: "expense" | "income";
  amount_minor: number;
  payment_method: string | null;
  note: string | null;
  tags: string[];
  categories: { name: string | null }[] | { name: string | null } | null;
};

// Supabase caps rows-per-request at 1000 by default. Fetch pages of that
// size until we get a short page. Hard-cap total to protect against runaway
// exports; nobody with 250k transactions should be doing this via a route.
const PAGE = 1000;
const MAX_ROWS = 250_000;

function categoryName(cat: Row["categories"]): string {
  if (!cat) return "";
  if (Array.isArray(cat)) return cat[0]?.name ?? "";
  return cat.name ?? "";
}

function csvEscape(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = request.nextUrl;
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const rows: Row[] = [];
  let offset = 0;
  let truncated = false;

  for (;;) {
    if (offset >= MAX_ROWS) {
      truncated = true;
      break;
    }

    let query = supabase
      .from("transactions")
      .select("occurred_on,type,amount_minor,payment_method,note,tags,categories:categories(name)")
      .order("occurred_on", { ascending: true })
      .order("created_at", { ascending: true })
      .range(offset, offset + PAGE - 1);

    if (from) query = query.gte("occurred_on", from);
    if (to) query = query.lte("occurred_on", to);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const page = (data as unknown as Row[] | null) ?? [];
    rows.push(...page);
    if (page.length < PAGE) break;
    offset += PAGE;
  }

  const header = ["date", "type", "category", "amount_php", "payment_method", "note", "tags"];
  const body = rows
    .map((r) =>
      [
        r.occurred_on,
        r.type,
        categoryName(r.categories),
        (r.amount_minor / 100).toFixed(2),
        r.payment_method ?? "",
        r.note ?? "",
        r.tags.join("|"),
      ]
        .map(csvEscape)
        .join(","),
    )
    .join("\n");

  const csv = `${header.join(",")}\n${body}${body ? "\n" : ""}`;
  const filename = `expense-tracker_${from ?? "all"}_${to ?? "all"}.csv`;

  const headers: Record<string, string> = {
    "content-type": "text/csv; charset=utf-8",
    "content-disposition": `attachment; filename="${filename}"`,
    "cache-control": "no-store",
    "x-row-count": String(rows.length),
  };
  if (truncated) headers["x-truncated"] = "true";

  return new NextResponse(csv, { status: 200, headers });
}
