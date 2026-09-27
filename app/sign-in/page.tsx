export default function SignInPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-4 py-10">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-[color:var(--color-muted-foreground)]">
          A magic link keeps things simple — no password to remember.
        </p>
      </header>

      <form className="flex flex-col gap-3" aria-label="Email sign-in">
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
          className="rounded-md border border-[color:var(--color-border)] bg-transparent px-3 py-2 text-base outline-none focus:border-[color:var(--color-accent)]"
        />
        <button
          type="submit"
          disabled
          className="rounded-md bg-[color:var(--color-accent)] px-4 py-2 text-sm font-medium text-[color:var(--color-accent-foreground)] disabled:opacity-50"
        >
          Send magic link
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs text-[color:var(--color-muted-foreground)]">
        <span className="h-px flex-1 bg-[color:var(--color-border)]" />
        or
        <span className="h-px flex-1 bg-[color:var(--color-border)]" />
      </div>

      <button
        type="button"
        disabled
        className="rounded-md border border-[color:var(--color-border)] px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        Continue with Google
      </button>

      <p className="text-center text-xs text-[color:var(--color-muted-foreground)]">
        Auth wiring lands in Phase 1 close-out once Supabase keys are set.
      </p>
    </main>
  );
}
