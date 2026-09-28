/**
 * Lightweight error reporter. Runs on client and server.
 *
 * Real integrations (Sentry, LogRocket, etc.) plug in by replacing the
 * body of `logError`. The env-flag branch keeps callsites stable so we
 * can wire Sentry pre-launch without touching every callsite.
 */

type Context = Record<string, unknown> | undefined;

export function logError(err: unknown, ctx?: Context) {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (dsn) {
    // Placeholder: import("@sentry/nextjs") and captureException here once
    // the account is provisioned. Left as a stub so we don't ship an
    // unused dep to the client bundle.
  }

  if (typeof console !== "undefined") {
    console.error("[app-error]", err, ctx ?? {});
  }
}
