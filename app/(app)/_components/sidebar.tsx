"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { openQuickAdd } from "@/lib/quick-add";
import { signOut } from "../_actions/sign-out";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/transactions", label: "Transactions", icon: ListIcon },
  { href: "/budgets", label: "Budgets", icon: TargetIcon },
  { href: "/recurring", label: "Recurring", icon: RepeatIcon },
  { href: "/categories", label: "Categories", icon: TagIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Mobile top bar — just brand + hamburger. Nav lives in a drawer. */}
      <div
        data-inert-when-modal
        className="flex items-center justify-between border-b border-[color:var(--color-border)] bg-[color:var(--color-muted)] px-4 py-3 md:hidden"
      >
        <Brand />
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(true)}
          className="rounded-md border border-[color:var(--color-border)] p-2"
        >
          <MenuIcon />
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      <aside
        data-inert-when-modal
        aria-label="Primary"
        className={`
          fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] shrink-0 flex-col gap-6 border-r border-[color:var(--color-border)] bg-[color:var(--color-muted)] p-4 transition-transform
          ${drawerOpen ? "translate-x-0" : "-translate-x-full"}
          md:sticky md:top-0 md:z-auto md:h-screen md:w-64 md:translate-x-0 md:self-start
        `.trim()}
      >
        <div className="flex items-center justify-between">
          <Brand />
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="rounded-md p-2 text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)] md:hidden"
          >
            <CloseIcon />
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setDrawerOpen(false);
            openQuickAdd();
          }}
          className="flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-[color:var(--color-accent)] px-3 py-2 text-sm font-semibold text-[color:var(--color-accent-foreground)] transition-opacity hover:opacity-90"
        >
          <PlusIcon />
          <span>New transaction</span>
          <kbd className="ml-1 hidden rounded border border-[color:var(--color-accent-foreground)]/40 px-1 text-[10px] font-normal opacity-70 md:inline">
            N
          </kbd>
        </button>

        <nav className="flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={() => setDrawerOpen(false)}
                className={`
                  group relative flex min-h-[44px] items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors
                  ${
                    active
                      ? "bg-[color:var(--color-surface)] text-[color:var(--color-foreground)] shadow-[0_1px_2px_rgba(1,7,54,0.06)]"
                      : "text-[color:var(--color-muted-foreground)] hover:bg-[color:var(--color-surface)] hover:text-[color:var(--color-foreground)]"
                  }
                `.trim()}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[color:var(--color-accent)]"
                  />
                )}
                <Icon />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-2 border-t border-[color:var(--color-border)] pt-4">
          <ThemeToggle />
          <form action={signOut} className="flex flex-col gap-2">
            <p
              className="truncate text-xs text-[color:var(--color-muted-foreground)]"
              title={email}
            >
              {email}
            </p>
            <button
              type="submit"
              className="min-h-[44px] rounded-md border border-[color:var(--color-border)] px-3 py-2 text-left text-sm hover:bg-[color:var(--color-border)]"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2">
      <span
        aria-hidden
        className="grid size-8 place-items-center rounded-md bg-[color:var(--color-accent)] text-sm font-bold text-[color:var(--color-accent-foreground)]"
      >
        ₱
      </span>
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-semibold tracking-tight">Expense Tracker</span>
        <span className="text-[10px] uppercase tracking-widest text-[color:var(--color-muted-foreground)]">
          Personal · PHP
        </span>
      </div>
    </Link>
  );
}

function DashboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <circle cx="4" cy="6" r="1" fill="currentColor" />
      <circle cx="4" cy="12" r="1" fill="currentColor" />
      <circle cx="4" cy="18" r="1" fill="currentColor" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

function RepeatIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M20 12l-8 8-9-9V3h8l9 9z" />
      <circle cx="7.5" cy="7.5" r="1.25" fill="currentColor" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
