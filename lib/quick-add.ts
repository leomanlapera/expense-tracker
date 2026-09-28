// Tiny pub-sub for opening the "Add expense" modal from anywhere on the app.
// The modal itself lives in the (app) layout and subscribes on mount.

const listeners = new Set<() => void>();

export function openQuickAdd() {
  for (const fn of listeners) fn();
}

export function subscribeQuickAdd(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
