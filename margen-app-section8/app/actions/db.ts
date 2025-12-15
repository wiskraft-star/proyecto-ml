"use server";

import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/db/client";
import { throwIfSupabaseError } from "@/lib/db/utils";

export async function dbHealthCheck() {
  // Protect: only logged-in users can call this.
  await requireUser();

  const admin = supabaseAdmin();

  const { count: salesCount, error: salesError } = await admin
    .schema("app")
    .from("sales")
    .select("id", { count: "exact", head: true });

  throwIfSupabaseError(salesError, "dbHealthCheck.salesCount");

  const { count: paymentsCount, error: paymentsError } = await admin
    .schema("app")
    .from("payments")
    .select("id", { count: "exact", head: true });

  throwIfSupabaseError(paymentsError, "dbHealthCheck.paymentsCount");

  return {
    ok: true,
    salesCount: salesCount ?? 0,
    paymentsCount: paymentsCount ?? 0,
    checkedAt: new Date().toISOString(),
  };
}
