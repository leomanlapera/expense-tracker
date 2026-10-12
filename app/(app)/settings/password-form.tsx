"use client";

import { useActionState } from "react";
import { changePassword, type PasswordActionState } from "./actions";
import { Field, TextInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

const INITIAL: PasswordActionState = {};

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="New password">
          <TextInput name="password" type="password" required minLength={8} autoComplete="new-password" />
        </Field>
        <Field label="Confirm password">
          <TextInput name="confirm" type="password" required minLength={8} autoComplete="new-password" />
        </Field>
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-[color:var(--color-budget-over)]">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="text-sm text-[color:var(--color-muted-foreground)]">
          Password updated.
        </p>
      )}
      <div className="flex justify-end border-t border-[color:var(--color-border)] pt-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Change password"}
        </Button>
      </div>
    </form>
  );
}
