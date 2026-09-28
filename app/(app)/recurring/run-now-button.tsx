"use client";

import { useTransition } from "react";
import { toast } from "@/lib/toast";
import { runRecurringNow } from "./actions";

export function RunNowButton() {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const res = await runRecurringNow();
          if (!res.ok) {
            toast(res.error, { variant: "error" });
            return;
          }
          toast(
            res.created === 0
              ? "Nothing due right now."
              : `Created ${res.created} transaction${res.created === 1 ? "" : "s"}.`,
            { variant: "success" },
          );
        });
      }}
      className="rounded-md bg-[color:var(--color-accent)] px-4 py-2 text-sm font-medium text-[color:var(--color-accent-foreground)] disabled:opacity-50"
    >
      {pending ? "Running…" : "Run due now"}
    </button>
  );
}
