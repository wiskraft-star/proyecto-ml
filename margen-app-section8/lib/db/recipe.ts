import "server-only";

import { supabaseAdmin } from "@/lib/db/client";
import { throwIfSupabaseError } from "@/lib/db/utils";
import { recipeLineUpsertSchema, sellerIdSchema } from "@/lib/db/validators";
import type { SupplyRecipeLine } from "@/lib/db/types";

export async function listRecipeLines(seller_id: number): Promise<SupplyRecipeLine[]> {
  sellerIdSchema.parse(seller_id);

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .schema("app")
    .from("supply_recipe_lines")
    .select("*")
    .eq("seller_id", seller_id)
    .order("created_at", { ascending: true });
  throwIfSupabaseError(error, "listRecipeLines");
  return (data ?? []) as SupplyRecipeLine[];
}

export async function upsertRecipeLine(input: { seller_id: number; supply_id: string; qty_per_sale: number }) {
  const parsed = recipeLineUpsertSchema.parse(input);

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .schema("app")
    .from("supply_recipe_lines")
    .upsert(parsed, { onConflict: "seller_id,supply_id" })
    .select("*")
    .single();

  throwIfSupabaseError(error, "upsertRecipeLine");
  return data as SupplyRecipeLine;
}

export async function deleteRecipeLine(seller_id: number, id: string) {
  sellerIdSchema.parse(seller_id);
  const admin = supabaseAdmin();
  const { error } = await admin
    .schema("app")
    .from("supply_recipe_lines")
    .delete()
    .eq("seller_id", seller_id)
    .eq("id", id);

  throwIfSupabaseError(error, "deleteRecipeLine");
  return { ok: true };
}
