"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; message: string };

// Restrict to same-origin, absolute-from-root paths so an attacker can't
// smuggle in `?next=https://evil` via a phished sign-in link.
function safeNextPath(raw: string | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

export function SignInForm({ initialError, next }: { initialError?: string; next?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>(
    initialError ? { kind: "error", message: initialError } : { kind: "idle" },
  );

  const supabase = getSupabaseBrowserClient();
  const safeNext = safeNextPath(next);
  const redirectTo =
    typeof window === "undefined"
      ? undefined
      : `${window.location.origin}/auth/callback${safeNext ? `?next=${encodeURIComponent(safeNext)}` : ""}`;

  async function sendMagicLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus({ kind: "sending" });
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo, shouldCreateUser: false },
    });
    setStatus(error ? { kind: "error", message: error.message } : { kind: "sent" });
  }

  return (
    <>
      <form className="flex flex-col gap-3" aria-label="Email sign-in" onSubmit={sendMagicLink}>
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status.kind === "sending" || status.kind === "sent"}
          className="rounded-md border border-[color:var(--color-border)] bg-transparent px-3 py-2 text-base outline-none focus:border-[color:var(--color-accent)]"
        />
        <button
          type="submit"
          disabled={status.kind === "sending" || status.kind === "sent"}
          className="rounded-md bg-[color:var(--color-accent)] px-4 py-2 text-sm font-medium text-[color:var(--color-accent-foreground)] disabled:opacity-50"
        >
          {status.kind === "sending" ? "Sending…" : status.kind === "sent" ? "Check your inbox" : "Send magic link"}
        </button>
      </form>

      {status.kind === "error" && (
        <p role="alert" className="text-center text-sm text-[color:var(--color-budget-over)]">
          {status.message}
        </p>
      )}
      {status.kind === "sent" && (
        <p className="text-center text-sm text-[color:var(--color-muted-foreground)]">
          A magic link is on the way. It expires in an hour.
        </p>
      )}
    </>
  );
}
