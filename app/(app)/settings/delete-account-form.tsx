"use client";

import { useActionState } from "react";
import { deleteAccount } from "./actions";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";

const INITIAL: { error?: string } = {};

export function DeleteAccountForm() {
  const [state, formAction, pending] = useActionState(deleteAccount, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field
        label={
          <>
            Type <span className="font-mono">DELETE</span> to confirm
          </>
        }
        className="sm:max-w-sm"
      >
        <TextInput name="confirm" required autoComplete="off" placeholder="DELETE" />
      </Field>
      {state.error && (
        <p role="alert" className="text-sm text-[color:var(--color-budget-over)]">
          {state.error}
        </p>
      )}
      <div className="flex justify-end border-t border-[color:var(--color-budget-over)]/30 pt-4">
        <Button type="submit" variant="danger" disabled={pending}>
          {pending ? "Deleting…" : "Delete account permanently"}
        </Button>
      </div>
    </form>
  );
}
