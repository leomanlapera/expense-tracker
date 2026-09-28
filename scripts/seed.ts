/**
 * Seed realistic data for a user.
 *
 *   pnpm seed --email=you@example.com          # append ~60 txns + budgets + recurring
 *   pnpm seed --email=you@example.com --clear  # wipe user's data first
 *
 * Requires SUPABASE_SECRET_KEY in .env.local — bypasses RLS as admin.
 * Safe to re-run; --clear removes prior seed + real data alike so use with care.
 */

import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { WebSocket } from "ws";
import { createClient } from "@supabase/supabase-js";

// Node 20 lacks a global WebSocket; Supabase's realtime constructor touches it
// on init even though we never subscribe. No-op on Node 22+.
if (typeof globalThis.WebSocket === "undefined") {
  (globalThis as unknown as { WebSocket: typeof WebSocket }).WebSocket = WebSocket;
}

loadEnv({ path: resolve(process.cwd(), ".env.local"), quiet: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, "").split("=");
    return [k, v.length ? v.join("=") : "true"];
  }),
);
const email = String(args.email ?? "");
const clear = args.clear === "true";
if (!email) {
  console.error("Usage: pnpm seed --email=you@example.com [--clear]");
  process.exit(1);
}

const admin = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---- Utilities

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function jitter(base: number, pct = 0.35): number {
  const spread = base * pct;
  return Math.max(1, Math.round(base + (Math.random() * 2 - 1) * spread));
}

// PH-flavoured expense presets. Amounts in ₱ (converted to minor units later).
type Preset = {
  category: string;
  type: "expense" | "income";
  amount: number;
  note?: string;
  payment_method?: string;
  tags?: string[];
  weight?: number; // how many rows to spawn per iteration (~90 days)
};

const PRESETS: Preset[] = [
  { category: "Food", type: "expense", amount: 180, note: "lunch", payment_method: "cash", tags: ["lunch"], weight: 20 },
  { category: "Food", type: "expense", amount: 90, note: "coffee", payment_method: "gcash", tags: ["coffee"], weight: 12 },
  { category: "Food", type: "expense", amount: 650, note: "dinner out", payment_method: "credit", weight: 5 },
  { category: "Food", type: "expense", amount: 1450, note: "groceries", payment_method: "debit", tags: ["grocery"], weight: 4 },
  { category: "Transport", type: "expense", amount: 30, note: "jeep", payment_method: "cash", weight: 18 },
  { category: "Transport", type: "expense", amount: 140, note: "grab", payment_method: "gcash", weight: 8 },
  { category: "Bills", type: "expense", amount: 1290, note: "internet", payment_method: "credit", tags: ["subscription"], weight: 1 },
  { category: "Bills", type: "expense", amount: 549, note: "Netflix", payment_method: "credit", tags: ["subscription"], weight: 1 },
  { category: "Bills", type: "expense", amount: 2400, note: "electricity", payment_method: "gcash", weight: 1 },
  { category: "Shopping", type: "expense", amount: 890, note: "clothes", payment_method: "credit", weight: 3 },
  { category: "Health", type: "expense", amount: 350, note: "pharmacy", payment_method: "cash", weight: 2 },
  { category: "Home", type: "expense", amount: 220, note: "cleaning", payment_method: "gcash", weight: 3 },
  { category: "Fun", type: "expense", amount: 420, note: "cinema", payment_method: "credit", weight: 2 },
  { category: "Personal", type: "expense", amount: 300, note: "haircut", payment_method: "cash", weight: 2 },
  { category: "Gifts", type: "expense", amount: 750, note: "birthday", payment_method: "gcash", tags: ["gift"], weight: 1 },
  { category: "Salary", type: "income", amount: 32000, note: "payday", payment_method: "debit", tags: ["salary"], weight: 6 },
];

async function findUserId(email: string): Promise<string | null> {
  const pageSize = 200;
  for (let page = 1; page < 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: pageSize });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match) return match.id;
    if (data.users.length < pageSize) break;
  }
  return null;
}

async function ensureUser(email: string): Promise<string> {
  const existing = await findUserId(email);
  if (existing) return existing;

  console.log(`[seed] No user with ${email}; creating…`);
  const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (error) throw error;
  if (!data.user) throw new Error("createUser returned no user");
  const userId = data.user.id;

  // The on_auth_user_created trigger runs in the same transaction, but the
  // profile / categories rows may need a brief moment before selects see them
  // when the Supabase JS client goes through PostgREST.
  for (let i = 0; i < 10; i++) {
    const { data: cats } = await admin.from("categories").select("id").eq("user_id", userId).limit(1);
    if (cats && cats.length > 0) return userId;
    await new Promise((r) => setTimeout(r, 200));
  }
  return userId;
}

async function main() {
  console.log(`[seed] Looking up user ${email}…`);
  const userId = await ensureUser(email);
  console.log(`[seed] User id: ${userId}`);

  if (clear) {
    console.log("[seed] --clear: wiping recurring / budgets / transactions for this user");
    await admin.from("recurring_rules").delete().eq("user_id", userId);
    await admin.from("budgets").delete().eq("user_id", userId);
    await admin.from("transactions").delete().eq("user_id", userId);
  }

  // Ensure the default set exists (for users created before the seed trigger,
  // or who archived-and-deleted defaults). Idempotent: unique on (user_id,
  // name, type) so upsert is a no-op on the ones already present.
  const DEFAULT_CATS: Array<{ name: string; type: "expense" | "income"; color: string }> = [
    { name: "Food", type: "expense", color: "#f97316" },
    { name: "Transport", type: "expense", color: "#0ea5e9" },
    { name: "Bills", type: "expense", color: "#a855f7" },
    { name: "Shopping", type: "expense", color: "#ec4899" },
    { name: "Health", type: "expense", color: "#ef4444" },
    { name: "Home", type: "expense", color: "#84cc16" },
    { name: "Fun", type: "expense", color: "#eab308" },
    { name: "Personal", type: "expense", color: "#64748b" },
    { name: "Gifts", type: "expense", color: "#14b8a6" },
    { name: "Other", type: "expense", color: "#94a3b8" },
    { name: "Salary", type: "income", color: "#22c55e" },
    { name: "Other", type: "income", color: "#94a3b8" },
  ];
  const { error: upErr } = await admin
    .from("categories")
    .upsert(
      DEFAULT_CATS.map((c) => ({ user_id: userId, ...c })),
      { onConflict: "user_id,name,type", ignoreDuplicates: true },
    );
  if (upErr) throw upErr;

  const { data: cats, error: catErr } = await admin
    .from("categories")
    .select("id,name,type")
    .eq("user_id", userId);
  if (catErr) throw catErr;
  const catBy = new Map<string, string>();
  for (const c of cats ?? []) catBy.set(`${c.type}:${c.name.toLowerCase()}`, c.id);
  if (catBy.size === 0) {
    throw new Error("Category upsert returned nothing — check schema.");
  }

  // Build a randomized list of transactions across the last 90 days.
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

  for (const p of PRESETS) {
    const count = p.weight ?? 1;
    for (let i = 0; i < count; i++) {
      const catId = catBy.get(`${p.type}:${p.category.toLowerCase()}`);
      if (!catId) continue;
      rows.push({
        user_id: userId,
        category_id: catId,
        type: p.type,
        amount_minor: jitter(p.amount) * 100,
        occurred_on: daysAgo(Math.floor(Math.random() * 90)),
        payment_method: p.payment_method ?? null,
        note: p.note ?? null,
        tags: p.tags ?? [],
      });
    }
  }

  console.log(`[seed] Inserting ${rows.length} transactions…`);
  const { error: insErr } = await admin.from("transactions").insert(rows);
  if (insErr) throw insErr;

  // A few budgets for the current month.
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  const monthStr = monthStart.toISOString().slice(0, 10);
  const budgets = [
    { category: "Food", limit: 12000 },
    { category: "Transport", limit: 2500 },
    { category: "Bills", limit: 5000 },
    { category: "Fun", limit: 1500 },
  ];
  const budgetRows = budgets
    .map((b) => ({
      user_id: userId,
      category_id: catBy.get(`expense:${b.category.toLowerCase()}`) ?? null,
      month: monthStr,
      limit_minor: b.limit * 100,
    }))
    .filter((r): r is typeof r & { category_id: string } => r.category_id !== null);

  console.log(`[seed] Upserting ${budgetRows.length} budgets…`);
  const { error: budErr } = await admin
    .from("budgets")
    .upsert(budgetRows, { onConflict: "user_id,category_id,month" });
  if (budErr) throw budErr;

  // Recurring rules — only if the table exists (migration 20260927140000 applied).
  const netflix = catBy.get("expense:bills");
  const salary = catBy.get("income:salary");
  const recurring: Array<Record<string, unknown>> = [];
  if (netflix) {
    recurring.push({
      user_id: userId,
      category_id: netflix,
      type: "expense",
      amount_minor: 549 * 100,
      interval: "monthly",
      next_run_on: daysAgo(-5),
      payment_method: "credit",
      note: "Netflix",
      tags: ["subscription"],
    });
  }
  if (salary) {
    recurring.push({
      user_id: userId,
      category_id: salary,
      type: "income",
      amount_minor: 32000 * 100,
      interval: "monthly",
      next_run_on: daysAgo(-10),
      payment_method: "debit",
      note: "payday",
      tags: ["salary"],
    });
  }
  if (recurring.length) {
    console.log(`[seed] Inserting ${recurring.length} recurring rules…`);
    const { error: recErr } = await admin.from("recurring_rules").insert(recurring);
    if (recErr && !/relation .* does not exist/.test(recErr.message)) throw recErr;
  }

  console.log("[seed] Done.");
}

main().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
