"use client";

import { useEffect, useRef, useState } from "react";
import type { Category } from "@/lib/db-types";
import { subscribeQuickAdd } from "@/lib/quick-add";
import { trapFocus } from "@/lib/focus-trap";
import { toast } from "@/lib/toast";
import { AddExpenseForm } from "@/app/(app)/transactions/add-expense-form";

export function QuickAddModal({
  categories,
  defaultDate,
  tagSuggestions,
  userId,
}: {
  categories: Category[];
  defaultDate: string;
  tagSuggestions: string[];
  userId?: string;
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => subscribeQuickAdd(() => setOpen(true)), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const releaseFocus = dialogRef.current ? trapFocus(dialogRef.current) : null;
    // Inert everything outside the modal so screen readers and Tab don't
    // reach the sidebar / FAB / page content while the dialog is open.
    const inertTargets = Array.from(
      document.querySelectorAll<HTMLElement>("[data-inert-when-modal]"),
    );
    for (const el of inertTargets) el.setAttribute("inert", "");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = original;
      releaseFocus?.();
      for (const el of inertTargets) el.removeAttribute("inert");
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-add-title"
      className="app-fade-in fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-[6vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        ref={dialogRef}
        className="app-scale-in w-full max-w-lg rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-background)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="quick-add-title" className="text-lg font-semibold">
              New transaction
            </h2>
            <p className="text-xs text-[color:var(--color-muted-foreground)]">
              Type, amount, category — Save.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            data-focus-skip
            className="rounded-md border border-[color:var(--color-border)] p-1 text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <AddExpenseForm
          categories={categories}
          defaultDate={defaultDate}
          tagSuggestions={tagSuggestions}
          userId={userId}
          onSaved={() => {
            setOpen(false);
            toast("Transaction saved.", { variant: "success" });
          }}
        />
      </div>
    </div>
  );
}
