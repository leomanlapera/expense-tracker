import { z } from "zod";

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(40, "Keep it under 40 chars."),
  type: z.enum(["expense", "income"]),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a #rrggbb color.")
    .optional()
    .or(z.literal("")),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
