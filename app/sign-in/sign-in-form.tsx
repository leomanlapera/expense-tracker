"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "./actions";

const INPUT_CLASS =
  "rounded-md border border-[color:var(--color-border)] bg-transparent px-3 py-2 text-base outline-none focus:border-[color:var(--color-accent)]";

export function SignInForm({ initialError, next }: { initialError?: string; next?: string }) {
  const [state, formAction, pending] = useActionState<SignInState, FormData>(signIn, {
    error: initialError,
  });

  return (
    <>
      <form className="flex flex-col gap-3" aria-label="Email sign-in" action={formAction}>
        <input type="hidden" name="next" value={next ?? ""} />
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue={state.email}
          disabled={pending}
          className={INPUT_CLASS}
        />
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          disabled={pending}
          className={INPUT_CLASS}
        />
        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-md bg-[color:var(--color-accent)] px-4 py-2 text-sm font-medium text-[color:var(--color-accent-foreground)] disabled:opacity-50"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {state.error && (
        <p role="alert" className="text-center text-sm text-[color:var(--color-budget-over)]">
          {state.error}
        </p>
      )}
    </>
  );
}
