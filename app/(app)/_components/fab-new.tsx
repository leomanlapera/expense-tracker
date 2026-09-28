"use client";

import { usePathname } from "next/navigation";
import { openQuickAdd } from "@/lib/quick-add";

export function FabNew() {
  const pathname = usePathname();
  if (pathname === "/sign-in") return null;

  return (
    <button
      type="button"
      data-inert-when-modal
      aria-label="Add transaction"
      title="Add transaction (N)"
      onClick={openQuickAdd}
      className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-6 z-40 flex size-14 items-center justify-center rounded-full bg-[color:var(--color-accent)] text-2xl font-semibold text-[color:var(--color-accent-foreground)] shadow-lg transition-transform hover:scale-105 md:bottom-8 md:right-8 md:hidden"
    >
      <span aria-hidden>+</span>
    </button>
  );
}
