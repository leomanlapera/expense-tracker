import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { parseMinor } from "@/lib/money";

type ImportResult = {
  inserted: number;
  skipped: { row: number; reason: string }[];
};

// Round-trips the exported format: date,type,category,amount_php,payment_method,note,tags
// Categories are looked up by lowercased name. Unknown categories skip the row
// with a reason so the user can fix + re-import.
const REQUIRED_HEADERS = [
  "date",
  "type",
  "category",
  "amount_php",
  "payment_method",
  "note",
  "tags",
] as const;

const MAX_ROWS = 10_000;

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Attach a CSV file as 'file'." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "File is empty." }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "CSV too large (max 10 MB)." }, { status: 413 });
  }

  const text = await file.text();
  const lines = text.replace(/\r\n/g, "\n").split("\n").filter((l) => l.length > 0);
  if (lines.length < 2) {
    return NextResponse.json({ error: "Need at least a header row + one data row." }, { status: 400 });
  }

  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length) {
    return NextResponse.json(
      { error: `Missing columns: ${missing.join(", ")}` },
      { status: 400 },
    );
  }
  const idx = Object.fromEntries(REQUIRED_HEADERS.map((h) => [h, headers.indexOf(h)])) as Record<
    (typeof REQUIRED_HEADERS)[number],
    number
  >;

  const dataLines = lines.slice(1, 1 + MAX_ROWS);
  const truncated = lines.length - 1 > MAX_ROWS;

  const { data: cats, error: catErr } = await supabase.from("categories").select("id,name,type");
  if (catErr) return NextResponse.json({ error: catErr.message }, { status: 500 });
  const catBy = new Map<string, { id: string; type: "expense" | "income" }>();
  for (const c of cats ?? []) catBy.set(`${c.type}:${c.name.toLowerCase()}`, { id: c.id, type: c.type });

  const rows: Array<{
    user_id: string;
    category_id: string;
    type: "expense" | "income";
    amount_minor: number;
    occurred_on: string;
    payment_method: string | null;
    note: string | null;
    tags: string[];
  }> = [];
  const skipped: ImportResult["skipped"] = [];

  dataLines.forEach((line, i) => {
    const rowNum = i + 2;
    const cols = splitCsvLine(line);
    const dateStr = (cols[idx.date] ?? "").trim();
    const typeStr = (cols[idx.type] ?? "").trim().toLowerCase();
    const catName = (cols[idx.category] ?? "").trim().toLowerCase();
    const amountStr = (cols[idx.amount_php] ?? "").trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      skipped.push({ row: rowNum, reason: "Date must be YYYY-MM-DD" });
      return;
    }
    if (typeStr !== "expense" && typeStr !== "income") {
      skipped.push({ row: rowNum, reason: `Unknown type: ${typeStr}` });
      return;
    }
    const cat = catBy.get(`${typeStr}:${catName}`);
    if (!cat) {
      skipped.push({ row: rowNum, reason: `Unknown ${typeStr} category: ${catName}` });
      return;
    }
    let amountMinor: bigint;
    try {
      amountMinor = parseMinor(amountStr);
    } catch (e) {
      skipped.push({ row: rowNum, reason: e instanceof Error ? e.message : "Bad amount" });
      return;
    }

    rows.push({
      user_id: user.id,
      category_id: cat.id,
      type: typeStr,
      amount_minor: Number(amountMinor),
      occurred_on: dateStr,
      payment_method: (cols[idx.payment_method] ?? "").trim() || null,
      note: (cols[idx.note] ?? "").trim() || null,
      tags: (cols[idx.tags] ?? "")
        .split("|")
        .map((t) => t.trim().replace(/^#/, "").toLowerCase())
        .filter(Boolean),
    });
  });

  let inserted = 0;
  if (rows.length > 0) {
    const CHUNK = 500;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      const { error } = await supabase.from("transactions").insert(chunk);
      if (error) {
        return NextResponse.json(
          { error: error.message, insertedBeforeError: inserted, skipped },
          { status: 500 },
        );
      }
      inserted += chunk.length;
    }
  }

  return NextResponse.json({
    inserted,
    skipped,
    truncated,
  } satisfies ImportResult & { truncated: boolean });
}
