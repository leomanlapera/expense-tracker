"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { categoryFormSchema } from "@/lib/validation/category";

export type ActionState =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

function toFormObject(fd: FormData) {
  return {
    name: String(fd.get("name") ?? ""),
    type: String(fd.get("type") ?? "expense"),
    color: String(fd.get("color") ?? ""),
  };
}

async function requireUser() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/sign-in");
  return { supabase, user: data.user };
}

function revalidateAll() {
  revalidatePath("/categories");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
}

export async function createCategory(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = categoryFormSchema.safeParse(toFormObject(fd));
  if (!parsed.success) {
    return { ok: false, error: "Fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const { supabase, user } = await requireUser();
  const v = parsed.data;

  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    name: v.name,
    type: v.type,
    color: v.color || null,
  });

  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

export async function renameCategory(id: string, name: string): Promise<ActionState> {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 40) {
    return { ok: false, error: "Name must be 1–40 characters." };
  }
  const { supabase } = await requireUser();
  const { error } = await supabase.from("categories").update({ name: trimmed }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

export async function setCategoryColor(id: string, color: string): Promise<ActionState> {
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    return { ok: false, error: "Use a #rrggbb color." };
  }
  const { supabase } = await requireUser();
  const { error } = await supabase.from("categories").update({ color }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

export async function setCategoryArchived(id: string, archived: boolean): Promise<ActionState> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("categories").update({ archived }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}
