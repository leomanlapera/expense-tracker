import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Cross-user RLS integration test.
 *
 * Boots two fresh users via the admin API, has User A insert a transaction,
 * then asserts User B cannot see / update / delete it.
 *
 * Runs against whatever `NEXT_PUBLIC_SUPABASE_URL` points to (typically the
 * cloud project). Cleans up its own users in `afterAll`.
 *
 * Skipped when `SUPABASE_SECRET_KEY` is absent, so `pnpm test` still runs
 * cleanly in environments without the secret (fresh clones, forks).
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;

const canRun = Boolean(url && publishableKey && secretKey);
const describeOrSkip = canRun ? describe : describe.skip;

describeOrSkip("RLS: transactions are user-scoped", () => {
  const admin = createClient(url!, secretKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let userA: { id: string; email: string; password: string };
  let userB: { id: string; email: string; password: string };
  let clientA: SupabaseClient;
  let clientB: SupabaseClient;
  let insertedId: string;

  async function makeUser(): Promise<{ id: string; email: string; password: string }> {
    const email = `rls-test-${crypto.randomUUID()}@example.test`;
    const password = crypto.randomUUID();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    if (!data.user) throw new Error("createUser returned no user");
    return { id: data.user.id, email, password };
  }

  function anonClient(): SupabaseClient {
    return createClient(url!, publishableKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  beforeAll(async () => {
    [userA, userB] = await Promise.all([makeUser(), makeUser()]);

    clientA = anonClient();
    clientB = anonClient();

    const [a, b] = await Promise.all([
      clientA.auth.signInWithPassword({ email: userA.email, password: userA.password }),
      clientB.auth.signInWithPassword({ email: userB.email, password: userB.password }),
    ]);
    if (a.error) throw a.error;
    if (b.error) throw b.error;

    // The handle_new_user trigger seeded 10 categories for each; grab one for A.
    const { data: cats, error: catErr } = await clientA
      .from("categories")
      .select("id")
      .eq("type", "expense")
      .limit(1);
    if (catErr) throw catErr;
    if (!cats?.[0]) throw new Error("Expected seeded categories for user A");

    const { data: inserted, error: insErr } = await clientA
      .from("transactions")
      .insert({
        user_id: userA.id,
        category_id: cats[0].id,
        type: "expense",
        amount_minor: 12345,
        occurred_on: "2026-09-27",
        note: "rls-fixture",
      })
      .select("id")
      .single();
    if (insErr) throw insErr;
    insertedId = inserted!.id;
  });

  afterAll(async () => {
    await Promise.allSettled([
      admin.auth.admin.deleteUser(userA.id),
      admin.auth.admin.deleteUser(userB.id),
    ]);
  });

  it("user A can see their own row", async () => {
    const { data, error } = await clientA
      .from("transactions")
      .select("id,note")
      .eq("id", insertedId);
    expect(error).toBeNull();
    expect(data).toEqual([{ id: insertedId, note: "rls-fixture" }]);
  });

  it("user B cannot see user A's row", async () => {
    const { data, error } = await clientB
      .from("transactions")
      .select("id")
      .eq("id", insertedId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("user B cannot list any of user A's transactions", async () => {
    const { data, error } = await clientB.from("transactions").select("id");
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("user B cannot update user A's row", async () => {
    const { data, error } = await clientB
      .from("transactions")
      .update({ note: "hacked" })
      .eq("id", insertedId)
      .select("id");
    // RLS makes it a no-op: no error, no rows affected.
    expect(error).toBeNull();
    expect(data).toEqual([]);

    const { data: check } = await clientA
      .from("transactions")
      .select("note")
      .eq("id", insertedId)
      .single();
    expect(check?.note).toBe("rls-fixture");
  });

  it("user B cannot delete user A's row", async () => {
    const { data, error } = await clientB
      .from("transactions")
      .delete()
      .eq("id", insertedId)
      .select("id");
    expect(error).toBeNull();
    expect(data).toEqual([]);

    const { data: check } = await clientA
      .from("transactions")
      .select("id")
      .eq("id", insertedId);
    expect(check).toEqual([{ id: insertedId }]);
  });
});
