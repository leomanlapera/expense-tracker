import type { ReactNode } from "react";

// Base surface primitive. Padding defaults to comfortable; pass `padding="tight"`
// for list-oriented cards. Border color follows the theme token, so both light
// and dark modes look intentional.

const PADDING = {
  none: "",
  tight: "p-4",
  base: "p-6",
} as const;

export function Card({
  children,
  className = "",
  padding = "base",
  tone = "default",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  padding?: keyof typeof PADDING;
  tone?: "default" | "muted" | "danger" | "warn";
  as?: "div" | "section" | "aside";
}) {
  const border =
    tone === "danger"
      ? "border-[color:var(--color-budget-over)]"
      : tone === "warn"
        ? "border-[color:var(--color-budget-warn)]"
        : "border-[color:var(--color-border)]";
  const bg = tone === "muted" ? "bg-[color:var(--color-muted)]" : "bg-[color:var(--color-surface)]";
  // Subtle shadow adds depth on the light surface. In dark mode we drop the
  // shadow (backgrounds are already dark) and lean on the border alone.
  const elevation =
    tone === "muted" || tone === "danger" || tone === "warn"
      ? ""
      : "shadow-[0_1px_2px_rgba(1,7,54,0.04),0_0_0_1px_rgba(1,7,54,0.02)]";
  return (
    <Tag
      className={`rounded-2xl border ${border} ${bg} ${elevation} ${PADDING[padding]} ${className}`}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm text-[color:var(--color-muted-foreground)]">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
