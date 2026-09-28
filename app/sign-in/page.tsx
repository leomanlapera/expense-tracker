import { SignInForm } from "./sign-in-form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; deleted?: string; next?: string; ["signed-out"]?: string }>;
}) {
  const sp = await searchParams;
  const signedOut = sp["signed-out"] === "1";

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-4 py-10">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-[color:var(--color-muted-foreground)]">
          Invite-only for now. Enter your email — you&rsquo;ll get a link if you&rsquo;ve been invited.
        </p>
      </header>

      {sp.deleted && (
        <p
          role="status"
          className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-muted)] px-3 py-2 text-center text-sm"
        >
          Your account and all its data have been deleted.
        </p>
      )}

      {signedOut && !sp.deleted && (
        <p
          role="status"
          className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-muted)] px-3 py-2 text-center text-sm"
        >
          Signed out. See you next time.
        </p>
      )}

      <SignInForm initialError={sp.error} next={sp.next} />
    </main>
  );
}
