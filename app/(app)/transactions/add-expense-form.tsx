"use client";

import { createTransaction } from "./actions";
import { TransactionForm } from "./transaction-form";
import type { Category } from "@/lib/db-types";

export function AddExpenseForm({
  categories,
  defaultDate,
  tagSuggestions = [],
  userId,
  onSaved,
}: {
  categories: Category[];
  defaultDate: string;
  tagSuggestions?: string[];
  userId?: string;
  onSaved?: () => void;
}) {
  return (
    <TransactionForm
      action={createTransaction}
      categories={categories}
      defaults={{ occurred_on: defaultDate }}
      submitLabel="Save"
      submittingLabel="Saving…"
      resetOnSuccess
      autoFocusAmount
      tagSuggestions={tagSuggestions}
      userId={userId}
      showReceipt={false}
      onSuccess={onSaved}
    />
  );
}
