"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type SignInState = { error?: string; email?: string };

// Restrict to same-origin, absolute-from-root paths so an attacker can't
// smuggle in `?next=https://evil` via a phished sign-in link.
function safeNextPath(raw: string): string {
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

export async function signIn(_prev: SignInState, fd: FormData): Promise<SignInState> {
  const email = String(fd.get("email") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password.", email };

  // Password auth only — no emails sent, so the free-tier email rate limit
  // never comes into play. Accounts are created by an admin via `pnpm invite`.
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message, email };

  redirect(safeNextPath(String(fd.get("next") ?? "")));
}
