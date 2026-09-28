import type { Category, Transaction } from "@/lib/db-types";

export type TxnListRow = Transaction & {
  categories: Pick<Category, "id" | "name" | "icon" | "color"> | null;
};

export const PAGE_SIZE = 50;

export const SORT_OPTIONS = [
  { value: "date_desc", label: "Newest first" },
  { value: "date_asc", label: "Oldest first" },
  { value: "amount_desc", label: "Largest amount" },
  { value: "amount_asc", label: "Smallest amount" },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]["value"];

export function isSortKey(v: string | undefined): v is SortKey {
  return !!v && SORT_OPTIONS.some((o) => o.value === v);
}
