import { Field, TextInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

// Native GET form: browser navigates to the CSV endpoint, which sends
// Content-Disposition: attachment, so the download triggers without JS
// and the settings page stays put. Empty inputs come through as ?from=&to=
// which the API treats as "no filter" (empty strings are falsy in the route).
export function ExportForm({ thisMonthFrom }: { thisMonthFrom: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <a
          href="/api/export/transactions.csv"
          className="rounded-md border border-[color:var(--color-border)] px-3 py-2 text-sm hover:bg-[color:var(--color-muted)]"
        >
          All transactions
        </a>
        <a
          href={`/api/export/transactions.csv?from=${thisMonthFrom}`}
          className="rounded-md border border-[color:var(--color-border)] px-3 py-2 text-sm hover:bg-[color:var(--color-muted)]"
        >
          This month
        </a>
      </div>

      <div className="border-t border-[color:var(--color-border)] pt-4">
        <p className="mb-2 text-xs uppercase tracking-wide text-[color:var(--color-muted-foreground)]">
          Custom range
        </p>
        <form
          method="get"
          action="/api/export/transactions.csv"
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <Field label="From" className="flex-1">
            <TextInput name="from" type="date" />
          </Field>
          <Field label="To" className="flex-1">
            <TextInput name="to" type="date" />
          </Field>
          <Button type="submit" variant="secondary" className="sm:self-end">
            Download
          </Button>
        </form>
      </div>
    </div>
  );
}
