import { notFound } from "next/navigation";
import { getSessionContext, getSupabaseServerClient } from "@/lib/supabase/server";
import type { Category, Transaction } from "@/lib/db-types";
import { EditTransactionForm } from "./edit-transaction-form";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [supabase, { user }] = await Promise.all([
    getSupabaseServerClient(),
    getSessionContext(),
  ]);

  const [{ data: txn }, { data: cats }] = await Promise.all([
    supabase.from("transactions").select("*").eq("id", id).maybeSingle(),
    supabase.from("categories").select("*").order("name"),
  ]);

  if (!txn) notFound();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Transactions", href: "/transactions" },
          { label: "Edit" },
        ]}
      />
      <PageHeader title="Edit transaction" />
      <Card as="section">
        <EditTransactionForm
          transaction={txn as Transaction}
          categories={(cats as Category[] | null) ?? []}
          userId={user?.id}
        />
      </Card>
    </main>
  );
}
