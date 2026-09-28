import { z } from "zod";

const PAYMENT_METHODS = ["cash", "gcash", "maya", "debit", "credit"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const PAYMENT_METHOD_VALUES: readonly PaymentMethod[] = PAYMENT_METHODS;

// Stored lowercase to keep the DB enum stable; display separately so
// wallet brands render correctly (GCash, not gcash).
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  gcash: "GCash",
  maya: "Maya",
  debit: "Debit",
  credit: "Credit",
};

export const transactionFormSchema = z.object({
  amount: z
    .string()
    .trim()
    .min(1, "Amount is required.")
    .regex(/^\d+(\.\d{0,2})?$/, "Enter a positive amount with up to 2 decimals."),
  type: z.enum(["expense", "income"]),
  category_id: z.string().uuid("Pick a category."),
  occurred_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD."),
  payment_method: z.enum(PAYMENT_METHODS).optional().nullable(),
  note: z.string().trim().max(280).optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(32)).max(10).default([]),
});

export type TransactionFormInput = z.input<typeof transactionFormSchema>;
export type TransactionFormValues = z.output<typeof transactionFormSchema>;
