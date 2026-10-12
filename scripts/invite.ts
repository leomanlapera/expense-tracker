/**
 * Create an invite-only account with a password — no email is sent, so this
 * never touches Supabase's free-tier email rate limit.
 *
 *   pnpm invite --email=friend@example.com                 # generates a password
 *   pnpm invite --email=friend@example.com --password=...  # use your own
 *   pnpm invite --email=friend@example.com --reset         # new password for an existing user
 *
 * Requires SUPABASE_SECRET_KEY in .env.local. Share the printed password with
 * the user out-of-band; they can change it under Settings → Password.
 */

import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { randomBytes } from "node:crypto";
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
const email = String(args.email ?? "").trim();
const reset = args.reset === "true";
if (!email) {
  console.error("Usage: pnpm invite --email=you@example.com [--password=...] [--reset]");
  process.exit(1);
}
const password = args.password ? String(args.password) : randomBytes(12).toString("base64url");
if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const admin = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
});

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

async function main() {
  const existing = await findUserId(email);

  if (existing && !reset) {
    console.error(`[invite] ${email} already exists. Pass --reset to set a new password.`);
    process.exit(1);
  }

  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing, { password });
    if (error) throw error;
    console.log(`[invite] Password reset for ${email}`);
  } else {
    // email_confirm skips the confirmation email; the on_auth_user_created
    // trigger seeds the profile + default categories.
    const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw error;
    console.log(`[invite] Created ${email}`);
  }

  if (!args.password) console.log(`[invite] Password: ${password}`);
}

main().catch((err) => {
  console.error("[invite] Failed:", err);
  process.exit(1);
});
