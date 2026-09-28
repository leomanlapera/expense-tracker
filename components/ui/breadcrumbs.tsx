import Link from "next/link";
import type { ReactNode } from "react";

export type Crumb = { label: ReactNode; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-[color:var(--color-muted-foreground)]">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((c, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1.5">
              {c.href && !isLast ? (
                <Link
                  href={c.href}
                  className="rounded hover:text-[color:var(--color-foreground)] hover:underline"
                >
                  {c.label}
                </Link>
              ) : (
                <span className={isLast ? "text-[color:var(--color-foreground)]" : ""}>
                  {c.label}
                </span>
              )}
              {!isLast && (
                <span aria-hidden className="text-[color:var(--color-muted-foreground)]">
                  ›
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
