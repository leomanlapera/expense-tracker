"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

type Result = {
  inserted: number;
  skipped: { row: number; reason: string }[];
  truncated?: boolean;
};

export function ImportForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<Result | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return toast("Pick a CSV file first.", { variant: "error" });

    setResult(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/import/transactions.csv", {
        method: "POST",
        body: fd,
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        toast(json?.error ?? `Import failed (${res.status})`, { variant: "error" });
        return;
      }
      setResult(json as Result);
      toast(
        `Imported ${(json as Result).inserted} transaction${(json as Result).inserted === 1 ? "" : "s"}.`,
        { variant: "success" },
      );
      if ((json as Result).inserted > 0) router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field
        label="CSV file"
        hint={fileName ? `Selected: ${fileName}` : "Max 10 MB · 10,000 rows"}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFileName(e.currentTarget.files?.[0]?.name ?? null)}
          className="text-sm file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-[color:var(--color-border)] file:bg-transparent file:px-3 file:py-1.5 file:text-sm file:text-[color:var(--color-foreground)]"
        />
      </Field>

      <details className="text-xs text-[color:var(--color-muted-foreground)]">
        <summary className="cursor-pointer select-none">Expected format</summary>
        <p className="mt-2">
          Round-trips the exported CSV:{" "}
          <code className="rounded bg-[color:var(--color-muted)] px-1 py-0.5">
            date,type,category,amount_php,payment_method,note,tags
          </code>
          . Category names must already exist — add them first if you&rsquo;re importing new
          ones.
        </p>
      </details>

      {result && (
        <div className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-muted)]/40 p-3 text-sm">
          <p>
            <span className="font-medium">Imported {result.inserted}</span>
            {result.skipped.length > 0 && (
              <span className="text-[color:var(--color-muted-foreground)]">
                {" · "}Skipped {result.skipped.length}
              </span>
            )}
            {result.truncated && (
              <span className="text-[color:var(--color-budget-warn)]">
                {" · "}File truncated at 10,000 rows
              </span>
            )}
          </p>
          {result.skipped.length > 0 && (
            <details className="mt-2 text-xs text-[color:var(--color-muted-foreground)]">
              <summary className="cursor-pointer select-none">View skipped rows</summary>
              <ul className="mt-2 flex flex-col gap-1">
                {result.skipped.slice(0, 25).map((s, i) => (
                  <li key={i}>
                    Row {s.row}: {s.reason}
                  </li>
                ))}
                {result.skipped.length > 25 && (
                  <li>…and {result.skipped.length - 25} more.</li>
                )}
              </ul>
            </details>
          )}
        </div>
      )}

      <div className="flex justify-end border-t border-[color:var(--color-border)] pt-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Importing…" : "Import CSV"}
        </Button>
      </div>
    </form>
  );
}
