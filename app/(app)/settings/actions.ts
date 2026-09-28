"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { profileFormSchema } from "@/lib/validation/profile";

export type ProfileActionState =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function updateProfile(
  _prev: ProfileActionState,
  fd: FormData,
): Promise<ProfileActionState> {
  const raw = {
    display_name: String(fd.get("display_name") ?? "").trim() || null,
    timezone: String(fd.get("timezone") ?? "Asia/Manila"),
  };
  const parsed = profileFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Fix the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { error } = await supabase
    .from("profiles")
    .update(parsed.data)
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteAccount(_prev: { error?: string }, fd: FormData): Promise<{ error?: string }> {
  const confirm = String(fd.get("confirm") ?? "");
  if (confirm !== "DELETE") {
    return { error: "Type DELETE (all caps) to confirm." };
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const admin = getSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: error.message };

  await supabase.auth.signOut();
  redirect("/sign-in?deleted=1");
}
