"use client";

import { useState, useTransition } from "react";
import type { Category } from "@/lib/db-types";
import { formatPhp } from "@/lib/money";
import { renameCategory, setCategoryArchived, setCategoryColor } from "./actions";

export function CategoryRow({
  category,
  monthTotal,
}: {
  category: Category;
  monthTotal: number;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await renameCategory(category.id, name);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setEditing(false);
    });
  }

  function toggleArchive() {
    setError(null);
    startTransition(async () => {
      const res = await setCategoryArchived(category.id, !category.archived);
      if (!res.ok) setError(res.error);
    });
  }

  function changeColor(color: string) {
    setError(null);
    startTransition(async () => {
      const res = await setCategoryColor(category.id, color);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <label
        className="relative inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[color:var(--color-border)] hover:border-[color:var(--color-accent)]"
        aria-label={`Change color for ${category.name}`}
        style={{ background: category.color ?? "transparent" }}
      >
        <input
          type="color"
          defaultValue={category.color ?? "#22396f"}
          disabled={pending}
          onBlur={(e) => {
            if (e.currentTarget.value !== category.color) changeColor(e.currentTarget.value);
          }}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </label>
      {editing ? (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              setEditing(false);
              setName(category.name);
              setError(null);
            }
          }}
          autoFocus
          aria-label={`Rename ${category.name}`}
          className="min-w-0 flex-1 rounded-md border border-[color:var(--color-border)] bg-transparent px-2 py-1 text-sm"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="min-w-0 flex-1 truncate text-left text-sm hover:underline"
        >
          {category.name}
          {category.archived && (
            <span className="ml-2 text-xs uppercase tracking-wide text-[color:var(--color-muted-foreground)]">
              archived
            </span>
          )}
        </button>
      )}
      <span className="hidden text-xs tabular-nums text-[color:var(--color-muted-foreground)] sm:inline">
        {monthTotal > 0 ? formatPhp(monthTotal) : "—"}
      </span>
      <span className="text-xs uppercase tracking-wide text-[color:var(--color-muted-foreground)]">
        {category.type}
      </span>
      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="rounded-md bg-[color:var(--color-accent)] px-2 py-1 text-xs text-[color:var(--color-accent-foreground)] disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setName(category.name);
              }}
              className="rounded-md border border-[color:var(--color-border)] px-2 py-1 text-xs"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={toggleArchive}
            disabled={pending}
            className="rounded-md border border-[color:var(--color-border)] px-2 py-1 text-xs text-[color:var(--color-muted-foreground)] disabled:opacity-50"
          >
            {category.archived ? "Unarchive" : "Archive"}
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-xs text-[color:var(--color-budget-over)]">
          {error}
        </p>
      )}
    </li>
  );
}
