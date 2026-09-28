"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { SORT_OPTIONS, type SortKey } from "./list-types";
import { Select } from "@/components/ui/select";

// Live-nav sort dropdown. Preserves every other search param so a sort change
// doesn't blow away the current month / category / tag / search / all-time.
export function SortSelect({ value }: { value: SortKey }) {
  const router = useRouter();
  const search = useSearchParams();
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-[color:var(--color-muted-foreground)]">
      <span>Sort</span>
      <Select
        value={value}
        disabled={pending}
        onChange={(next) => {
          const params = new URLSearchParams(search.toString());
          if (next === "date_desc") params.delete("sort");
          else params.set("sort", next);
          const qs = params.toString();
          startTransition(() => router.push(qs ? `/transactions?${qs}` : "/transactions"));
        }}
        options={SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        ariaLabel="Sort transactions"
      />
    </label>
  );
}
