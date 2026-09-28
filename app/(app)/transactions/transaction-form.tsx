"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import type { ActionState } from "./actions";
import { PAYMENT_METHOD_LABELS, PAYMENT_METHOD_VALUES } from "@/lib/validation/transaction";
import type { Category, Transaction, TxnType } from "@/lib/db-types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Field, TextInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { notifyTxnCreated } from "@/lib/tx-bus";

const INITIAL: ActionState = { ok: true };

export type TransactionFormAction = (state: ActionState, fd: FormData) => Promise<ActionState>;

type Defaults = {
  amount?: string;
  type?: TxnType;
  category_id?: string;
  occurred_on: string;
  payment_method?: string | null;
  note?: string | null;
  tags?: string;
  receipt_path?: string | null;
};

export function TransactionForm({
  action,
  categories,
  defaults,
  submitLabel,
  submittingLabel,
  resetOnSuccess = false,
  autoFocusAmount = false,
  tagSuggestions = [],
  userId,
  showReceipt = true,
  onSuccess,
}: {
  action: TransactionFormAction;
  categories: Category[];
  defaults: Defaults;
  submitLabel: string;
  submittingLabel: string;
  resetOnSuccess?: boolean;
  autoFocusAmount?: boolean;
  tagSuggestions?: string[];
  userId?: string;
  showReceipt?: boolean;
  onSuccess?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  const initialType: TxnType = defaults.type ?? "expense";
  const [type, setType] = useState<TxnType>(initialType);
  const [categoryId, setCategoryId] = useState<string>(defaults.category_id ?? "");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  // Optional fields default open when editing an existing row so nothing is hidden.
  const [showMore, setShowMore] = useState<boolean>(
    Boolean(defaults.note || defaults.tags || defaults.payment_method || defaults.receipt_path),
  );

  const canAttachReceipts = showReceipt && Boolean(userId);

  const wrappedAction: TransactionFormAction = async (prev, fd) => {
    setUploadError(null);

    const file = fileRef.current?.files?.[0];
    if (file && file.size > 0 && userId) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const supabase = getSupabaseBrowserClient();
      setUploading(true);
      const { error } = await supabase.storage
        .from("receipts")
        .upload(path, file, { contentType: file.type || "application/octet-stream" });
      setUploading(false);
      if (error) {
        setUploadError(`Receipt upload failed: ${error.message}`);
        return { ok: false, error: `Receipt upload failed: ${error.message}` };
      }
      fd.set("receipt_path", path);
    }

    const result = await action(prev, fd);
    if (result.ok) {
      if (result.created) notifyTxnCreated(result.created);
      startTransition(() => {
        if (resetOnSuccess) {
          formRef.current?.reset();
          setType(initialType);
          setCategoryId("");
          setShowMore(false);
        }
        amountRef.current?.focus();
        onSuccess?.();
      });
    }
    return result;
  };
  const [state, formAction, pending] = useActionState(wrappedAction, INITIAL);

  const activeCats = categories.filter((c) => c.type === type && !c.archived);
  const fieldErrors = state.ok ? {} : (state.fieldErrors ?? {});

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-6">
      {/* Step 1 — type toggle */}
      <fieldset className="flex gap-1 rounded-full border border-[color:var(--color-border)] p-1 text-sm">
        <legend className="sr-only">Type</legend>
        {(["expense", "income"] as const).map((t) => (
          <label
            key={t}
            className={`flex-1 cursor-pointer rounded-full px-3 py-2 text-center capitalize transition-colors ${
              type === t
                ? "bg-[color:var(--color-accent)] text-[color:var(--color-accent-foreground)]"
                : "text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)]"
            }`}
          >
            <input
              type="radio"
              name="type"
              value={t}
              checked={type === t}
              onChange={() => {
                setType(t);
                setCategoryId("");
              }}
              className="sr-only"
            />
            {t === "expense" ? "Expense" : "Income"}
          </label>
        ))}
      </fieldset>

      {/* Step 2 — amount (big, autofocused) */}
      <label className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-[color:var(--color-muted-foreground)]">
          Amount <RequiredMark />
        </span>
        <div className="flex items-center rounded-md border border-[color:var(--color-border)] focus-within:border-[color:var(--color-accent)]">
          <span className="pl-4 pr-1 text-3xl text-[color:var(--color-muted-foreground)]">₱</span>
          <input
            ref={amountRef}
            name="amount"
            inputMode="decimal"
            placeholder="0.00"
            required
            autoFocus={autoFocusAmount}
            defaultValue={formatAmount(defaults.amount)}
            onFocus={(e) => {
              e.currentTarget.value = e.currentTarget.value.replace(/,/g, "");
            }}
            onBlur={(e) => {
              e.currentTarget.value = formatAmount(e.currentTarget.value);
            }}
            className="min-w-0 flex-1 bg-transparent px-2 py-3 text-3xl font-semibold tabular-nums outline-none"
            aria-invalid={!!fieldErrors.amount}
          />
        </div>
        {fieldErrors.amount && (
          <span role="alert" className="text-xs text-[color:var(--color-budget-over)]">
            {fieldErrors.amount[0]}
          </span>
        )}
      </label>

      {/* Step 3 — category */}
      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs uppercase tracking-wide text-[color:var(--color-muted-foreground)]">
          Category <RequiredMark />
        </legend>
        {activeCats.length === 0 ? (
          <p className="text-sm text-[color:var(--color-muted-foreground)]">
            No {type} categories yet. Add one on the Categories page.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {activeCats.map((c) => {
              const active = categoryId === c.id;
              return (
                <label
                  key={c.id}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)] text-[color:var(--color-accent-foreground)]"
                      : "border-[color:var(--color-border)] hover:border-[color:var(--color-accent)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="category_id"
                    value={c.id}
                    checked={active}
                    onChange={() => setCategoryId(c.id)}
                    required
                    className="sr-only"
                  />
                  {c.color && (
                    <span
                      aria-hidden
                      className="mr-2 inline-block size-2 rounded-full align-middle"
                      style={{ background: c.color }}
                    />
                  )}
                  {c.name}
                </label>
              );
            })}
          </div>
        )}
        {fieldErrors.category_id && (
          <p role="alert" className="text-xs text-[color:var(--color-budget-over)]">
            {fieldErrors.category_id[0]}
          </p>
        )}
      </fieldset>

      {/* Step 4 — advanced (collapsed by default on create) */}
      <div className="border-t border-[color:var(--color-border)] pt-4">
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          aria-expanded={showMore}
          className="flex items-center gap-2 text-xs uppercase tracking-wide text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)]"
        >
          <span>{showMore ? "Hide" : "Show"} more details</span>
          <span aria-hidden className={`transition-transform ${showMore ? "rotate-180" : ""}`}>
            <ChevronDown />
          </span>
        </button>

        {showMore && (
          <div className="mt-4 grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Date">
                <TextInput
                  name="occurred_on"
                  type="date"
                  defaultValue={defaults.occurred_on}
                  required
                />
              </Field>
              <Field label="Payment">
                <Select
                  name="payment_method"
                  defaultValue={defaults.payment_method ?? ""}
                  options={[
                    { value: "", label: "—" },
                    ...PAYMENT_METHOD_VALUES.map((m) => ({ value: m, label: PAYMENT_METHOD_LABELS[m] })),
                  ]}
                />
              </Field>
            </div>

            <Field label="Note">
              <TextInput
                name="note"
                placeholder="optional"
                maxLength={280}
                defaultValue={defaults.note ?? ""}
              />
            </Field>

            <Field
              label="Tags"
              hint="Comma-separated. Lowercased server-side."
            >
              <TextInput
                name="tags"
                placeholder="e.g. work, refund, coffee"
                defaultValue={defaults.tags ?? ""}
                list={tagSuggestions.length > 0 ? "tag-suggestions" : undefined}
              />
              {tagSuggestions.length > 0 && (
                <datalist id="tag-suggestions">
                  {tagSuggestions.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              )}
            </Field>

            {canAttachReceipts && (
              <Field
                label="Receipt photo"
                hint={
                  defaults.receipt_path ? (
                    <>
                      Current:{" "}
                      <a
                        href={`/api/receipts/${defaults.receipt_path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        view
                      </a>{" "}
                      · pick a new file to replace.
                    </>
                  ) : undefined
                }
              >
                <input
                  ref={fileRef}
                  name="receipt"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="flex h-10 w-full items-center rounded-md border border-[color:var(--color-border)] bg-transparent px-3 text-sm file:mr-3 file:h-6 file:cursor-pointer file:rounded file:border file:border-[color:var(--color-border)] file:bg-transparent file:px-2 file:text-xs file:text-[color:var(--color-foreground)]"
                />
              </Field>
            )}
          </div>
        )}
      </div>

      {/* Ensures the existing receipt survives edit-with-no-new-file. */}
      {defaults.receipt_path && (
        <input type="hidden" name="receipt_path" defaultValue={defaults.receipt_path} />
      )}

      {/* Ensure `occurred_on` still submits when the More section is collapsed on create. */}
      {!showMore && (
        <input type="hidden" name="occurred_on" defaultValue={defaults.occurred_on} />
      )}

      {uploadError && (
        <p role="alert" className="text-sm text-[color:var(--color-budget-over)]">
          {uploadError}
        </p>
      )}
      {!state.ok && (
        <p role="alert" className="text-sm text-[color:var(--color-budget-over)]">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {uploading ? "Uploading receipt…" : pending ? submittingLabel : submitLabel}
        </Button>
        <span className="text-xs text-[color:var(--color-muted-foreground)]">
          {defaults.occurred_on === new Date().toISOString().slice(0, 10)
            ? "Dated today"
            : `Dated ${defaults.occurred_on}`}
        </span>
      </div>
    </form>
  );
}

// Adds group separators to a decimal string. "1234.5" → "1,234.5".
// Blanks out on empty / invalid input so the placeholder can show through.
function formatAmount(raw?: string): string {
  if (!raw) return "";
  const cleaned = raw.replace(/[^\d.]/g, "");
  if (!cleaned) return "";
  const [whole, frac] = cleaned.split(".");
  const groupedWhole = whole ? Number(whole).toLocaleString("en-US") : "0";
  return frac !== undefined ? `${groupedWhole}.${frac.slice(0, 2)}` : groupedWhole;
}

function RequiredMark() {
  return (
    <span aria-hidden className="text-[color:var(--color-budget-over)]">
      *
    </span>
  );
}

function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function fromTransaction(t: Transaction): Defaults {
  return {
    amount: (t.amount_minor / 100).toFixed(2),
    type: t.type,
    category_id: t.category_id ?? "",
    occurred_on: t.occurred_on,
    payment_method: t.payment_method,
    note: t.note,
    tags: t.tags.join(", "),
    receipt_path: t.receipt_path,
  };
}
