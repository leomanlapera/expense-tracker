"use client";

import { useEffect, useRef, useState } from "react";
import { subscribeToasts, type ToastItem } from "@/lib/toast";

const VARIANT_STYLES: Record<ToastItem["variant"], string> = {
  info: "border-[color:var(--color-border)]",
  success: "border-[color:var(--color-budget-ok)]",
  error: "border-[color:var(--color-budget-over)]",
};

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    return subscribeToasts((t) => {
      setItems((prev) => [...prev, t]);
      const handle = setTimeout(() => dismiss(t.id, true), t.durationMs);
      timers.current.set(t.id, handle);
    });
  }, []);

  function dismiss(id: number, expired: boolean) {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setItems((prev) => {
      const item = prev.find((x) => x.id === id);
      if (item && expired) item.onDismiss?.();
      return prev.filter((x) => x.id !== id);
    });
  }

  if (items.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2"
    >
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto flex items-start gap-3 rounded-md border bg-[color:var(--color-surface)] px-3 py-2 text-sm shadow-md ${VARIANT_STYLES[t.variant]}`}
        >
          <span className="flex-1">{t.message}</span>
          {t.action && (
            <button
              type="button"
              onClick={() => {
                t.action?.onClick();
                dismiss(t.id, false);
              }}
              className="rounded border border-[color:var(--color-border)] px-2 py-0.5 text-xs font-medium hover:bg-[color:var(--color-muted)]"
            >
              {t.action.label}
            </button>
          )}
          <button
            type="button"
            onClick={() => dismiss(t.id, true)}
            aria-label="Dismiss"
            className="text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)]"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
