"use client";

import { useEffect, useRef, useState } from "react";
import { openQuickAdd } from "@/lib/quick-add";
import { trapFocus } from "@/lib/focus-trap";

const SHORTCUTS: { keys: string; desc: string }[] = [
  { keys: "n", desc: "New transaction (open the modal)" },
  { keys: "?", desc: "Show / hide this cheatsheet" },
  { keys: "Esc", desc: "Close the modal or cheatsheet" },
];

function shouldIgnoreEvent(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "Escape" && open) {
        setOpen(false);
        return;
      }

      if (shouldIgnoreEvent(e.target)) return;

      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        openQuickAdd();
        return;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open || !dialogRef.current) return;
    return trapFocus(dialogRef.current);
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      className="app-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => setOpen(false)}
    >
      <div
        ref={dialogRef}
        className="app-scale-in w-full max-w-sm rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-background)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-medium">Keyboard shortcuts</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            data-focus-skip
            className="rounded-md border border-[color:var(--color-border)] px-2 py-1 text-xs text-[color:var(--color-muted-foreground)]"
            aria-label="Close"
          >
            Esc
          </button>
        </div>
        <dl className="mt-4 flex flex-col gap-2 text-sm">
          {SHORTCUTS.map((s) => (
            <div key={s.keys} className="flex items-center justify-between gap-3">
              <dt className="text-[color:var(--color-muted-foreground)]">{s.desc}</dt>
              <dd>
                <kbd className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-muted)] px-2 py-0.5 font-mono text-xs">
                  {s.keys}
                </kbd>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
