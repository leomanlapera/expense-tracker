import type { ReactNode } from "react";

// Standalone "nothing here yet" surface. Dashed border + muted tint reads as
// "intentionally empty, not broken." Use inside a section on its own — not
// inside a filled Card, or the borders will fight.

export function EmptyState({
  title,
  description,
  action,
  className = "",
}: {
  title?: ReactNode;
  description: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-muted)]/40 p-8 text-center ${className}`}
    >
      {title && <p className="text-sm font-medium">{title}</p>}
      <p
        className={`text-sm text-[color:var(--color-muted-foreground)] ${
          title ? "mt-1" : ""
        }`}
      >
        {description}
      </p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
