"use client";

import { useActionState, useRef } from "react";
import { createCategory, type ActionState } from "./actions";
import { Field, TextInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

const INITIAL: ActionState = { ok: true };

export function NewCategoryForm() {
  const ref = useRef<HTMLFormElement>(null);

  const wrapped = async (prev: ActionState, fd: FormData): Promise<ActionState> => {
    const res = await createCategory(prev, fd);
    if (res.ok) ref.current?.reset();
    return res;
  };
  const [state, formAction, pending] = useActionState(wrapped, INITIAL);

  return (
    <form
      ref={ref}
      action={formAction}
      className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end"
    >
      <Field label="Name">
        <TextInput name="name" required maxLength={40} placeholder="e.g. Coffee" />
      </Field>
      <Field label="Type">
        <Select
          name="type"
          defaultValue="expense"
          options={[
            { value: "expense", label: "Expense" },
            { value: "income", label: "Income" },
          ]}
          className="w-32"
        />
      </Field>
      <Field label="Color">
        <input
          name="color"
          type="color"
          defaultValue="#22396f"
          className="h-10 w-16 cursor-pointer rounded-md border border-[color:var(--color-border)] bg-transparent p-1"
        />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add"}
      </Button>
      {!state.ok && (
        <p
          role="alert"
          className="text-sm text-[color:var(--color-budget-over)] sm:col-span-full"
        >
          {state.error}
        </p>
      )}
    </form>
  );
}
