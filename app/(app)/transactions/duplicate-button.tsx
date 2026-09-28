"use client";

import { useTransition } from "react";
import { toast } from "@/lib/toast";
import { duplicateTransaction } from "./actions";

export function DuplicateButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-label="Log this transaction again"
      onClick={() => {
        startTransition(async () => {
          const res = await duplicateTransaction(id);
          if (res.ok) toast("Logged again with today's date.", { variant: "success" });
          else toast(res.error, { variant: "error" });
        });
      }}
      className="rounded-md border border-[color:var(--color-border)] px-2 py-1 text-xs text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)] disabled:opacity-50"
      title="Duplicate with today's date"
    >
      {pending ? "…" : "↻"}
    </button>
  );
}
