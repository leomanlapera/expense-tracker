import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <p className="text-xs uppercase tracking-widest text-[color:var(--color-muted-foreground)]">
        404
      </p>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-sm text-[color:var(--color-muted-foreground)]">
        The page you&rsquo;re looking for doesn&rsquo;t exist or has moved.
      </p>
      <Link
        href="/dashboard"
        className="rounded-md bg-[color:var(--color-accent)] px-4 py-2 text-sm font-medium text-[color:var(--color-accent-foreground)]"
      >
        Back to dashboard
      </Link>
    </main>
  );
}
