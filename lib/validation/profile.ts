import { z } from "zod";

// Small, PH-first list. Widen later if we take on international users.
export const TIMEZONE_OPTIONS = [
  "Asia/Manila",
  "Asia/Hong_Kong",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
  "Europe/London",
  "America/Los_Angeles",
  "America/New_York",
  "UTC",
] as const;

export const profileFormSchema = z.object({
  display_name: z.string().trim().max(60, "Keep it under 60 chars.").nullable(),
  timezone: z.enum(TIMEZONE_OPTIONS),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
