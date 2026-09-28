"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { parseMinor } from "@/lib/money";
import { budgetFormSchema } from "@/lib/validation/budget";

export type ActionState =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

function toFormObject(fd: FormData) {
  return {
    category_id: String(fd.get("category_id") ?? ""),
    month: String(fd.get("month") ?? ""),
    limit: String(fd.get("limit") ?? ""),
  };
}

async function requireUser() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/sign-in");
  return { supabase, user: data.user };
}

export async function upsertBudget(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = budgetFormSchema.safeParse(toFormObject(fd));
  if (!parsed.success) {
    return { ok: false, error: "Fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const { supabase, user } = await requireUser();
  const v = parsed.data;
  const monthDate = `${v.month}-01`;

  const { error } = await supabase.from("budgets").upsert(
    {
      user_id: user.id,
      category_id: v.category_id,
      month: monthDate,
      limit_minor: Number(parseMinor(v.limit)),
    },
    { onConflict: "user_id,category_id,month" },
  );

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/budgets");
  return { ok: true };
}

export async function deleteBudget(id: string): Promise<ActionState> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/budgets");
  return { ok: true };
}

/**
 * Copies every budget from the previous month into `targetMonth` for
 * categories that don't already have a budget there. `targetMonth` is
 * YYYY-MM. Returns the number of budgets created.
 */
export async function copyBudgetsFromPreviousMonth(
  targetMonth: string,
): Promise<{ ok: true; created: number } | { ok: false; error: string }> {
  if (!/^\d{4}-\d{2}$/.test(targetMonth)) {
    return { ok: false, error: "Month must be YYYY-MM." };
  }

  const { supabase, user } = await requireUser();

  const [y, m] = targetMonth.split("-").map(Number);
  const prevMonth = m === 1 ? 12 : m - 1;
  const prevYear = m === 1 ? y - 1 : y;
  const prevMonthDate = `${prevYear}-${String(prevMonth).padStart(2, "0")}-01`;
  const targetMonthDate = `${targetMonth}-01`;

  const [{ data: prev, error: prevErr }, { data: current, error: curErr }] =
    await Promise.all([
      supabase.from("budgets").select("category_id,limit_minor").eq("month", prevMonthDate),
      supabase.from("budgets").select("category_id").eq("month", targetMonthDate),
    ]);
  if (prevErr) return { ok: false, error: prevErr.message };
  if (curErr) return { ok: false, error: curErr.message };

  const existing = new Set((current ?? []).map((b) => b.category_id));
  const toInsert = (prev ?? [])
    .filter((b) => !existing.has(b.category_id))
    .map((b) => ({
      user_id: user.id,
      category_id: b.category_id,
      month: targetMonthDate,
      limit_minor: b.limit_minor,
    }));

  if (toInsert.length === 0) {
    revalidatePath("/budgets");
    return { ok: true, created: 0 };
  }

  const { error: insErr } = await supabase.from("budgets").insert(toInsert);
  if (insErr) return { ok: false, error: insErr.message };

  revalidatePath("/dashboard");
  revalidatePath("/budgets");
  return { ok: true, created: toInsert.length };
}
