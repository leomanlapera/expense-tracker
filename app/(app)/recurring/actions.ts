"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { parseMinor } from "@/lib/money";
import { recurringFormSchema } from "@/lib/validation/recurring";

export type ActionState =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

function toFormObject(fd: FormData) {
  return {
    category_id: String(fd.get("category_id") ?? ""),
    type: String(fd.get("type") ?? "expense"),
    amount: String(fd.get("amount") ?? ""),
    interval: String(fd.get("interval") ?? "monthly"),
    next_run_on: String(fd.get("next_run_on") ?? ""),
    payment_method: (fd.get("payment_method") as string) || null,
    note: (fd.get("note") as string) || null,
    tags: String(fd.get("tags") ?? "")
      .split(",")
      .map((t) => t.trim().replace(/^#/, "").toLowerCase())
      .filter(Boolean),
  };
}

async function requireUser() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/sign-in");
  return { supabase, user: data.user };
}

function revalidateAll() {
  revalidatePath("/recurring");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
}

export async function createRecurringRule(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = recurringFormSchema.safeParse(toFormObject(fd));
  if (!parsed.success) {
    return { ok: false, error: "Fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const { supabase, user } = await requireUser();
  const v = parsed.data;

  const { error } = await supabase.from("recurring_rules").insert({
    user_id: user.id,
    category_id: v.category_id,
    type: v.type,
    amount_minor: Number(parseMinor(v.amount)),
    interval: v.interval,
    next_run_on: v.next_run_on,
    payment_method: v.payment_method ?? null,
    note: v.note ?? null,
    tags: v.tags,
  });
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

export async function setRecurringActive(id: string, active: boolean): Promise<ActionState> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("recurring_rules").update({ active }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

export async function deleteRecurringRule(id: string): Promise<ActionState> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("recurring_rules").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

export async function runRecurringNow(): Promise<{ ok: true; created: number } | { ok: false; error: string }> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("process_recurring_for_user");
  if (error) return { ok: false, error: error.message };
  const created = Array.isArray(data) ? Number(data[0]?.created ?? 0) : 0;
  revalidateAll();
  return { ok: true, created };
}
