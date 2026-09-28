"use client";

import { useSyncExternalStore } from "react";

function subscribe(fn: () => void) {
  window.addEventListener("online", fn);
  window.addEventListener("offline", fn);
  return () => {
    window.removeEventListener("online", fn);
    window.removeEventListener("offline", fn);
  };
}

function getSnapshot(): boolean {
  return navigator.onLine;
}

function getServerSnapshot(): boolean {
  return true;
}

export function OfflineBanner() {
  const online = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[color:var(--color-budget-warn)] bg-[color:var(--color-muted)] px-4 py-2 text-center text-sm"
    >
      Offline — your last saves may not have gone through. Reconnect and reload.
    </div>
  );
}
