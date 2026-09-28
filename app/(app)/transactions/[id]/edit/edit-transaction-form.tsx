"use client";

import { useRouter } from "next/navigation";
import { updateTransaction } from "../../actions";
import { TransactionForm, fromTransaction } from "../../transaction-form";
import type { Category, Transaction } from "@/lib/db-types";

export function EditTransactionForm({
  transaction,
  categories,
  userId,
}: {
  transaction: Transaction;
  categories: Category[];
  userId?: string;
}) {
  const router = useRouter();
  const action = updateTransaction.bind(null, transaction.id);

  return (
    <TransactionForm
      action={action}
      categories={categories}
      defaults={fromTransaction(transaction)}
      submitLabel="Update"
      submittingLabel="Updating…"
      userId={userId}
      showReceipt={false}
      onSuccess={() => router.push("/transactions")}
    />
  );
}
