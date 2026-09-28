import type {
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

// Fixed h-10 (40px) on every form control so inputs, custom Select, and
// Buttons all align on the same baseline. Textarea stays flexible height.
const CONTROL_BASE =
  "block w-full rounded-md border border-[color:var(--color-border)] bg-transparent px-3 text-sm text-[color:var(--color-foreground)] outline-none transition-colors focus:border-[color:var(--color-accent)] disabled:opacity-50";
const HEIGHT = "h-10";

export function Field({
  label,
  hint,
  error,
  htmlFor,
  className = "",
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className}`} htmlFor={htmlFor}>
      <span className="text-xs uppercase tracking-wide text-[color:var(--color-muted-foreground)]">
        {label}
      </span>
      {children}
      {hint && (
        <span className="text-xs text-[color:var(--color-muted-foreground)]">{hint}</span>
      )}
      {error && (
        <span role="alert" className="text-xs text-[color:var(--color-budget-over)]">
          {error}
        </span>
      )}
    </label>
  );
}

export function TextInput({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${CONTROL_BASE} ${HEIGHT} ${className}`} {...props} />;
}

export function TextareaInput({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${CONTROL_BASE} py-2 ${className}`} {...props} />;
}
