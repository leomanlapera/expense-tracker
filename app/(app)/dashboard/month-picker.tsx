"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function MonthPicker({ value, base }: { value: string; base: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-[color:var(--color-muted-foreground)]">
      <span className="sr-only">Month</span>
      <input
        type="month"
        defaultValue={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.currentTarget.value;
          if (!next) return;
          startTransition(() => router.push(`${base}?month=${next}`));
        }}
        className="rounded-md border border-[color:var(--color-border)] bg-transparent px-3 py-1.5 text-sm text-[color:var(--color-foreground)]"
      />
    </label>
  );
}
