import "server-only";

import { supabaseAdmin } from "@/lib/db/client";
import { throwIfSupabaseError } from "@/lib/db/utils";
import { sellerIdSchema, supplyUpsertSchema } from "@/lib/db/validators";
import type { Supply } from "@/lib/db/types";

export async function listSupplies(seller_id: number): Promise<Supply[]> {
  sellerIdSchema.parse(seller_id);
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .schema("app")
    .from("supplies")
    .select("*")
    .eq("seller_id", seller_id)
    .order("name", { ascending: true });
  throwIfSupabaseError(error, "listSupplies");
  return (data ?? []) as Supply[];
}

export async function upsertSupply(input: { seller_id: number; name: string; unit_cost: number }) {
  const parsed = supplyUpsertSchema.parse(input);
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .schema("app")
    .from("supplies")
    .upsert(parsed, { onConflict: "seller_id,name" })
    .select("*")
    .single();
  throwIfSupabaseError(error, "upsertSupply");
  return data as Supply;
}

export async function deleteSupply(seller_id: number, id: string) {
  sellerIdSchema.parse(seller_id);
  // id validated at call-site if needed
  const admin = supabaseAdmin();
  const { error } = await admin.schema("app").from("supplies").delete().eq("seller_id", seller_id).eq("id", id);
  throwIfSupabaseError(error, "deleteSupply");
  return { ok: true };
}