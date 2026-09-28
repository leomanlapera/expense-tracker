import { z } from "zod";

export const budgetFormSchema = z.object({
  category_id: z.string().uuid("Pick a category."),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be YYYY-MM."),
  limit: z
    .string()
    .trim()
    .min(1, "Limit is required.")
    .regex(/^\d+(\.\d{0,2})?$/, "Enter a positive amount with up to 2 decimals."),
});

export type BudgetFormValues = z.infer<typeof budgetFormSchema>;
