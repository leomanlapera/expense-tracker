"use client";

import { useActionState, useRef } from "react";
import { upsertBudget, type ActionState } from "./actions";
import type { Category } from "@/lib/db-types";
import { Field, TextInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

const INITIAL: ActionState = { ok: true };

export function BudgetForm({
  categories,
  monthValue,
}: {
  categories: Category[];
  monthValue: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  const wrapped = async (prev: ActionState, fd: FormData): Promise<ActionState> => {
    const res = await upsertBudget(prev, fd);
    if (res.ok) formRef.current?.reset();
    return res;
  };
  const [state, formAction, pending] = useActionState(wrapped, INITIAL);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end"
    >
      <Field label="Category">
        <Select
          name="category_id"
          required
          placeholder="Pick a category…"
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
        />
      </Field>
      <Field label="Month">
        <TextInput name="month" type="month" defaultValue={monthValue} required />
      </Field>
      <Field label="Limit (₱)">
        <TextInput
          name="limit"
          inputMode="decimal"
          placeholder="0.00"
          required
          className="w-32 tabular-nums"
        />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Set budget"}
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
