"use client";

/**
 * Custom Select: styled trigger button + popover list.
 *
 * - Keyboard: Space/Enter/ArrowDown to open, Arrow keys to navigate,
 *   Enter/Space to select, Escape to close, letter keys to jump.
 * - Emits a hidden <input> under `name` so it works inside a plain <form>.
 * - Portal-free: the popover positions absolute relative to the trigger.
 *
 * Options can be grouped by passing `{ group, value, label }` items; groups
 * render an uppercase separator label.
 */

import { useEffect, useId, useMemo, useRef, useState } from "react";

export type SelectOption = {
  value: string;
  label: string;
  group?: string;
  hint?: string;
  disabled?: boolean;
};

type Props = {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  ariaLabel?: string;
  className?: string;
};

export function Select({
  name,
  value: controlledValue,
  defaultValue,
  onChange,
  options,
  placeholder = "Select…",
  disabled,
  required,
  ariaLabel,
  className = "",
}: Props) {
  const isControlled = controlledValue !== undefined;
  const [internal, setInternal] = useState<string>(defaultValue ?? "");
  const value = isControlled ? controlledValue : internal;

  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState<number>(-1);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const listId = useId();

  const enabled = useMemo(() => options.filter((o) => !o.disabled), [options]);
  const selectedIndex = enabled.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? enabled[selectedIndex] : null;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggleOpen() {
    setOpen((prev) => {
      const next = !prev;
      if (next) setHighlight(selectedIndex >= 0 ? selectedIndex : 0);
      return next;
    });
  }

  function openMenu() {
    if (open) return;
    setOpen(true);
    setHighlight(selectedIndex >= 0 ? selectedIndex : 0);
  }

  useEffect(() => {
    if (!open || highlight < 0) return;
    const node = listRef.current?.querySelector<HTMLElement>(`[data-idx="${highlight}"]`);
    node?.scrollIntoView({ block: "nearest" });
  }, [open, highlight]);

  function commit(next: string) {
    if (!isControlled) setInternal(next);
    onChange?.(next);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function onTriggerKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      openMenu();
    }
  }

  function onListKeyDown(e: React.KeyboardEvent<HTMLUListElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1 >= enabled.length ? 0 : h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 < 0 ? enabled.length - 1 : h - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setHighlight(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setHighlight(enabled.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const opt = enabled[highlight];
      if (opt) commit(opt.value);
    } else if (/^[a-z0-9]$/i.test(e.key)) {
      const start = highlight + 1;
      const idx = enabled.findIndex((o, i) => i >= start && o.label.toLowerCase().startsWith(e.key.toLowerCase()));
      const wrapped = idx >= 0 ? idx : enabled.findIndex((o) => o.label.toLowerCase().startsWith(e.key.toLowerCase()));
      if (wrapped >= 0) setHighlight(wrapped);
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {name && (
        <input
          type="hidden"
          name={name}
          value={value}
          required={required}
        />
      )}
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={toggleOpen}
        onKeyDown={onTriggerKeyDown}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-[color:var(--color-border)] bg-transparent px-3 text-left text-sm outline-none transition-colors focus:border-[color:var(--color-accent)] disabled:opacity-50"
      >
        <span className={selected ? "" : "text-[color:var(--color-muted-foreground)]"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronIcon />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          onKeyDown={onListKeyDown}
          autoFocus
          className="absolute left-0 right-0 z-30 mt-1 max-h-64 overflow-auto rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] py-1 shadow-lg"
        >
          {options.map((opt, i) => {
            const enabledIdx = enabled.findIndex((o) => o.value === opt.value);
            const isHighlighted = enabledIdx === highlight;
            const isSelected = opt.value === value;
            const prev = i > 0 ? options[i - 1] : null;
            const showGroup = opt.group && opt.group !== prev?.group;
            return (
              <li key={`${opt.value}-${i}`} role="none">
                {showGroup && (
                  <div className="px-3 pb-1 pt-2 text-[10px] uppercase tracking-widest text-[color:var(--color-muted-foreground)]">
                    {opt.group}
                  </div>
                )}
                <button
                  type="button"
                  role="option"
                  data-idx={enabledIdx}
                  aria-selected={isSelected}
                  disabled={opt.disabled}
                  onMouseEnter={() => enabledIdx >= 0 && setHighlight(enabledIdx)}
                  onClick={() => !opt.disabled && commit(opt.value)}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors ${
                    isHighlighted && !opt.disabled
                      ? "bg-[color:var(--color-muted)]"
                      : ""
                  } ${isSelected ? "font-medium" : ""} ${
                    opt.disabled ? "cursor-not-allowed opacity-50" : ""
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  <span className="flex items-center gap-2">
                    {opt.hint && (
                      <span className="text-xs text-[color:var(--color-muted-foreground)]">
                        {opt.hint}
                      </span>
                    )}
                    {isSelected && <CheckIcon />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
      className="shrink-0 text-[color:var(--color-muted-foreground)]"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
