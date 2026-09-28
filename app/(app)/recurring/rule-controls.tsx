"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { deleteRecurringRule, setRecurringActive } from "./actions";

const CONFIRM_WINDOW_MS = 4000;

export function ToggleActive({ id, active }: { id: string; active: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => void (await setRecurringActive(id, !active)))}
      className="rounded-md border border-[color:var(--color-border)] px-2 py-1 text-xs text-[color:var(--color-muted-foreground)] disabled:opacity-50 hover:text-[color:var(--color-foreground)]"
    >
      {pending ? "…" : active ? "Pause" : "Resume"}
    </button>
  );
}

export function DeleteRule({ id }: { id: string }) {
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
  return (
    <button
      type="button"
      disabled={pending}
      onClick={
        armed
          ? () => startTransition(async () => void (await deleteRecurringRule(id)))
          : arm
      }
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
      {pending ? "…" : armed ? "Sure?" : "Delete"}
    </button>
  );
}
