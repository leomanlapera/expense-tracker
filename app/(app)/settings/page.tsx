import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/db-types";
import { DeleteAccountForm } from "./delete-account-form";
import { ExportForm } from "./export-form";
import { ImportForm } from "./import-form";
import { ProfileForm } from "./profile-form";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export default async function SettingsPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id ?? "")
    .maybeSingle();
  const profile = (profileData as Profile | null) ?? null;

  const today = new Date();
  const monthAnchor = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}`;
  const from = `${monthAnchor}-01`;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
      <Breadcrumbs
        items={[{ label: "Home", href: "/dashboard" }, { label: "Settings" }]}
      />
      <PageHeader title="Settings" eyebrow={`Signed in as ${user?.email}`} />

      <Card as="section">
        <CardHeader
          title="Profile"
          subtitle="Your display name and timezone. Timezone controls how dates group on the dashboard."
        />
        <ProfileForm
          displayName={profile?.display_name ?? null}
          timezone={profile?.timezone ?? "Asia/Manila"}
        />
      </Card>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card as="section">
          <CardHeader
            title="Export data"
            subtitle="Download transactions as CSV — everything, this month, or a custom range."
          />
          <ExportForm thisMonthFrom={from} />
        </Card>

        <Card as="section">
          <CardHeader
            title="Import CSV"
            subtitle="Bring in transactions from an exported file or another tool."
          />
          <ImportForm />
        </Card>
      </section>

      <div aria-hidden className="mt-2 border-t border-[color:var(--color-border)]" />

      <Card as="section" tone="danger">
        <CardHeader
          title="Danger zone"
          subtitle="Deleting your account removes your profile, categories, transactions, and budgets. This can’t be undone."
        />
        <DeleteAccountForm />
      </Card>
    </main>
  );
}
