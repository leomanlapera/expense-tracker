"use client";

import { useTransition } from "react";
import { toast } from "@/lib/toast";
import { copyBudgetsFromPreviousMonth } from "./actions";

export function CopyFromPreviousButton({ targetMonth }: { targetMonth: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const res = await copyBudgetsFromPreviousMonth(targetMonth);
          if (!res.ok) {
            toast(res.error, { variant: "error" });
            return;
          }
          toast(
            res.created === 0
              ? "Nothing to copy — every category already has a budget."
              : `Copied ${res.created} budget${res.created === 1 ? "" : "s"} from last month.`,
            { variant: "success" },
          );
        });
      }}
      className="rounded-md border border-[color:var(--color-border)] px-3 py-2 text-sm hover:bg-[color:var(--color-muted)] disabled:opacity-50"
    >
      {pending ? "Copying…" : "Copy from last month"}
    </button>
  );
}
