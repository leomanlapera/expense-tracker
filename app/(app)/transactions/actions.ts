"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { parseMinor } from "@/lib/money";
import { transactionFormSchema } from "@/lib/validation/transaction";
import type { TxnCreatedRow } from "@/lib/tx-bus";

export type ActionState =
  | { ok: true; created?: TxnCreatedRow }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

function toFormObject(fd: FormData) {
  return {
    // Strip commas the display formatter may have added on the client.
    amount: String(fd.get("amount") ?? "").replace(/,/g, ""),
    type: String(fd.get("type") ?? "expense"),
    category_id: String(fd.get("category_id") ?? ""),
    occurred_on: String(fd.get("occurred_on") ?? ""),
    payment_method: (fd.get("payment_method") as string) || null,
    note: (fd.get("note") as string) || null,
    tags: String(fd.get("tags") ?? "")
      .split(",")
      .map((t) => t.trim().replace(/^#/, "").toLowerCase())
      .filter(Boolean),
  };
}

// Only trust receipt paths under the user's own folder. Storage RLS enforces
// this too, but keeping bad rows out of the DB avoids dangling references.
function safeReceiptPath(raw: FormDataEntryValue | null, userId: string): string | null {
  if (typeof raw !== "string" || raw.length === 0) return null;
  const prefix = `${userId}/`;
  if (!raw.startsWith(prefix)) return null;
  if (raw.includes("..")) return null;
  return raw;
}

async function requireUser() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/sign-in");
  return { supabase, user: data.user };
}

export async function createTransaction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = transactionFormSchema.safeParse(toFormObject(fd));
  if (!parsed.success) {
    return { ok: false, error: "Fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const { supabase, user } = await requireUser();
  const v = parsed.data;
  const receiptPath = safeReceiptPath(fd.get("receipt_path"), user.id);

  const { data: inserted, error } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      category_id: v.category_id,
      type: v.type,
      amount_minor: Number(parseMinor(v.amount)),
      occurred_on: v.occurred_on,
      payment_method: v.payment_method ?? null,
      note: v.note ?? null,
      tags: v.tags,
      receipt_path: receiptPath,
    })
    .select("id,type,amount_minor,occurred_on,note,categories:categories(name,color)")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/transactions");

  const cat = inserted?.categories as { name: string | null; color: string | null } | { name: string | null; color: string | null }[] | null;
  const flatCat = Array.isArray(cat) ? (cat[0] ?? null) : cat;
  return {
    ok: true,
    created: inserted
      ? {
          id: inserted.id as string,
          type: inserted.type as "expense" | "income",
          amount_minor: inserted.amount_minor as number,
          occurred_on: inserted.occurred_on as string,
          note: (inserted.note as string | null) ?? null,
          category: flatCat ? { name: flatCat.name, color: flatCat.color } : null,
        }
      : undefined,
  };
}

export async function updateTransaction(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = transactionFormSchema.safeParse(toFormObject(fd));
  if (!parsed.success) {
    return { ok: false, error: "Fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const { supabase, user } = await requireUser();
  const v = parsed.data;
  const receiptPath = safeReceiptPath(fd.get("receipt_path"), user.id);

  const { error } = await supabase
    .from("transactions")
    .update({
      category_id: v.category_id,
      type: v.type,
      amount_minor: Number(parseMinor(v.amount)),
      occurred_on: v.occurred_on,
      payment_method: v.payment_method ?? null,
      note: v.note ?? null,
      tags: v.tags,
      receipt_path: receiptPath,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  return { ok: true };
}

export async function deleteTransaction(id: string): Promise<ActionState> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  return { ok: true };
}

// Duplicates a transaction with today's date. RLS makes sure the source
// row belongs to the current user before we can even read it.
export async function duplicateTransaction(id: string): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const { data: src, error: fetchErr } = await supabase
    .from("transactions")
    .select("category_id,type,amount_minor,payment_method,note,tags")
    .eq("id", id)
    .maybeSingle();
  if (fetchErr) return { ok: false, error: fetchErr.message };
  if (!src) return { ok: false, error: "Original transaction not found." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .maybeSingle();
  const tz = (profile as { timezone?: string } | null)?.timezone ?? "Asia/Manila";
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());

  const { error: insErr } = await supabase.from("transactions").insert({
    user_id: user.id,
    category_id: src.category_id,
    type: src.type,
    amount_minor: src.amount_minor,
    payment_method: src.payment_method,
    note: src.note,
    tags: src.tags,
    occurred_on: today,
  });
  if (insErr) return { ok: false, error: insErr.message };

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  return { ok: true };
}
