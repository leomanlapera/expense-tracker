"use client";

import { useEffect } from "react";
import { logError } from "@/lib/logger";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError(error, { digest: error.digest, boundary: "(app)" });
  }, [error]);

  return (
    <main className="flex w-full flex-1 flex-col items-center justify-center gap-4 px-4 py-10 md:px-8">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="max-w-md text-center text-sm text-[color:var(--color-muted-foreground)]">
        {error.message || "An unexpected error occurred."}
        {error.digest && (
          <>
            <br />
            <span className="text-xs">ref: {error.digest}</span>
          </>
        )}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-[color:var(--color-accent)] px-4 py-2 text-sm font-medium text-[color:var(--color-accent-foreground)]"
      >
        Try again
      </button>
    </main>
  );
}
