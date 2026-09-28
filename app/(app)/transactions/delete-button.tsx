"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { deleteTransaction } from "./actions";

const CONFIRM_WINDOW_MS = 4000;

export function DeleteButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function arm() {
    setArmed(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setArmed(false), CONFIRM_WINDOW_MS);
  }

  function confirmDelete() {
    if (timer.current) clearTimeout(timer.current);
    startTransition(async () => {
      await deleteTransaction(id);
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={
        pending
          ? "Deleting transaction"
          : armed
            ? "Confirm delete"
            : "Delete transaction"
      }
      onClick={armed ? confirmDelete : arm}
      onBlur={() => {
        if (timer.current) clearTimeout(timer.current);
        setArmed(false);
      }}
      className={`rounded-md border px-2 py-1 text-xs disabled:opacity-50 ${
        armed
          ? "border-[color:var(--color-budget-over)] bg-[color:var(--color-budget-over)] text-white"
          : "border-[color:var(--color-border)] text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-budget-over)]"
      }`}
    >
      {pending ? "…" : armed ? "Sure?" : "×"}
    </button>
  );
}
