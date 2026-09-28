"use client";

import { useActionState, useRef } from "react";
import { createRecurringRule, type ActionState } from "./actions";
import type { Category } from "@/lib/db-types";
import { Field, TextInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { PAYMENT_METHOD_LABELS, PAYMENT_METHOD_VALUES } from "@/lib/validation/transaction";

const INITIAL: ActionState = { ok: true };

export function NewRecurringForm({
  categories,
  defaultDate,
}: {
  categories: Category[];
  defaultDate: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  const wrapped = async (prev: ActionState, fd: FormData): Promise<ActionState> => {
    const res = await createRecurringRule(prev, fd);
    if (res.ok) formRef.current?.reset();
    return res;
  };
  const [state, formAction, pending] = useActionState(wrapped, INITIAL);
  const fieldErrors = state.ok ? {} : (state.fieldErrors ?? {});

  return (
    <form ref={formRef} action={formAction} className="grid gap-3 md:grid-cols-2">
      <Field
        label="Category"
        className="md:col-span-2"
        error={fieldErrors.category_id?.[0]}
      >
        <Select
          name="category_id"
          required
          placeholder="Pick one…"
          options={categories.map((c) => ({
            value: c.id,
            label: c.name,
            group: c.type === "income" ? "Income" : "Expense",
          }))}
        />
      </Field>

      <Field label="Type">
        <Select
          name="type"
          defaultValue="expense"
          options={[
            { value: "expense", label: "Expense" },
            { value: "income", label: "Income" },
          ]}
        />
      </Field>

      <Field label="Amount (₱)" error={fieldErrors.amount?.[0]}>
        <TextInput
          name="amount"
          inputMode="decimal"
          placeholder="0.00"
          required
          className="tabular-nums"
        />
      </Field>

      <Field label="Interval">
        <Select
          name="interval"
          defaultValue="monthly"
          options={[
            { value: "daily", label: "Daily" },
            { value: "weekly", label: "Weekly" },
            { value: "monthly", label: "Monthly" },
          ]}
        />
      </Field>

      <Field label="First run date">
        <TextInput name="next_run_on" type="date" defaultValue={defaultDate} required />
      </Field>

      <Field label="Payment">
        <Select
          name="payment_method"
          defaultValue=""
          options={[
            { value: "", label: "—" },
            ...PAYMENT_METHOD_VALUES.map((m) => ({ value: m, label: PAYMENT_METHOD_LABELS[m] })),
          ]}
        />
      </Field>

      <Field label="Note" className="md:col-span-2">
        <TextInput name="note" placeholder="e.g. Netflix" maxLength={280} />
      </Field>

      <Field label="Tags" className="md:col-span-2">
        <TextInput name="tags" placeholder="e.g. subscription" />
      </Field>

      <div className="flex items-center gap-3 md:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add recurring rule"}
        </Button>
        {!state.ok && (
          <p role="alert" className="text-sm text-[color:var(--color-budget-over)]">
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}
