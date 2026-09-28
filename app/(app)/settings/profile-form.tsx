"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileActionState } from "./actions";
import { TIMEZONE_OPTIONS } from "@/lib/validation/profile";
import { Field, TextInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

const INITIAL: ProfileActionState = { ok: true };

// Compute once at module load — timezone offsets change at DST boundaries,
// but not between renders in the same session. Zero SSR/CSR hydration risk.
const TZ_OPTIONS = TIMEZONE_OPTIONS.map((tz) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    timeZoneName: "shortOffset",
  }).formatToParts(new Date());
  const offset = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  return { value: tz, label: offset ? `${tz} (${offset})` : tz };
});

export function ProfileForm({
  displayName,
  timezone,
}: {
  displayName: string | null;
  timezone: string;
}) {
  const [state, formAction, pending] = useActionState(updateProfile, INITIAL);
  const fieldErrors = state.ok ? {} : (state.fieldErrors ?? {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Display name" error={fieldErrors.display_name?.[0]}>
          <TextInput
            name="display_name"
            defaultValue={displayName ?? ""}
            maxLength={60}
            placeholder="e.g. June"
            aria-invalid={!!fieldErrors.display_name}
          />
        </Field>
        <Field label="Timezone" hint="Controls how dates group on the dashboard.">
          <Select name="timezone" defaultValue={timezone} options={TZ_OPTIONS} />
        </Field>
      </div>
      {!state.ok && (
        <p role="alert" className="text-sm text-[color:var(--color-budget-over)]">
          {state.error}
        </p>
      )}
      <div className="flex justify-end border-t border-[color:var(--color-border)] pt-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
