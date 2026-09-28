import { z } from "zod";

const PAYMENT_METHODS = ["cash", "gcash", "maya", "debit", "credit"] as const;

export const recurringFormSchema = z.object({
  category_id: z.string().uuid("Pick a category."),
  type: z.enum(["expense", "income"]),
  amount: z
    .string()
    .trim()
    .min(1, "Amount is required.")
    .regex(/^\d+(\.\d{0,2})?$/, "Enter a positive amount with up to 2 decimals."),
  interval: z.enum(["daily", "weekly", "monthly"]),
  next_run_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD."),
  payment_method: z.enum(PAYMENT_METHODS).optional().nullable(),
  note: z.string().trim().max(280).optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(32)).max(10).default([]),
});

export type RecurringFormValues = z.infer<typeof recurringFormSchema>;
