import { redirect } from "next/navigation";
import { getSessionContext, getSupabaseServerClient } from "@/lib/supabase/server";
import { todayInTimezone } from "@/lib/date";
import type { Category } from "@/lib/db-types";
import { FabNew } from "./_components/fab-new";
import { KeyboardShortcuts } from "./_components/keyboard-shortcuts";
import { NavProgress } from "./_components/nav-progress";
import { QuickAddModal } from "./_components/quick-add-modal";
import { Sidebar } from "./_components/sidebar";
import { OfflineBanner } from "./_components/offline-banner";
import { Toaster } from "./_components/toaster";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [supabase, { user, timezone }] = await Promise.all([
    getSupabaseServerClient(),
    getSessionContext(),
  ]);
  if (!user) redirect("/sign-in");

  const [{ data: categories }, { data: recentTagRows }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase
      .from("transactions")
      .select("tags")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const tagSuggestions = Array.from(
    new Set(
      (recentTagRows ?? [])
        .flatMap((r: { tags: string[] | null }) => r.tags ?? [])
        .filter(Boolean),
    ),
  )
    .sort()
    .slice(0, 50);

  const today = todayInTimezone(timezone);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[color:var(--color-accent)] focus:px-3 focus:py-2 focus:text-sm focus:text-[color:var(--color-accent-foreground)]"
      >
        Skip to main content
      </a>
      <NavProgress />
      <Sidebar email={user.email ?? ""} />
      <FabNew />
      <KeyboardShortcuts />
      <Toaster />
      <OfflineBanner />
      <QuickAddModal
        categories={(categories as Category[] | null) ?? []}
        defaultDate={today}
        tagSuggestions={tagSuggestions}
        userId={user.id}
      />
      <div
        id="main"
        data-inert-when-modal
        className="flex min-w-0 flex-1 flex-col"
      >
        {children}
      </div>
    </div>
  );
}
