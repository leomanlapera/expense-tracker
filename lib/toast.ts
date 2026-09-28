// Tiny pub-sub toast queue. No React context, no provider — client
// components import `toast()` and the mounted <Toaster /> subscribes.

export type ToastVariant = "info" | "success" | "error";

export type ToastAction = {
  label: string;
  onClick: () => void;
};

export type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
  durationMs: number;
  action?: ToastAction;
  onDismiss?: () => void;
};

const listeners = new Set<(t: ToastItem) => void>();
let nextId = 1;

export function toast(
  message: string,
  opts: {
    variant?: ToastVariant;
    durationMs?: number;
    action?: ToastAction;
    onDismiss?: () => void;
  } = {},
) {
  const item: ToastItem = {
    id: nextId++,
    message,
    variant: opts.variant ?? "info",
    durationMs: opts.durationMs ?? 4000,
    action: opts.action,
    onDismiss: opts.onDismiss,
  };
  for (const fn of listeners) fn(item);
  return item.id;
}

export function subscribeToasts(fn: (t: ToastItem) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
