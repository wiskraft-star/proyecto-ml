import "server-only";

import { supabaseAdmin } from "@/lib/db/client";
import { throwIfSupabaseError } from "@/lib/db/utils";
import { sellerIdSchema, skuCostUpsertSchema, skuSchema } from "@/lib/db/validators";
import type { SkuCost } from "@/lib/db/types";

export async function listSkuCosts(seller_id: number): Promise<SkuCost[]> {
  sellerIdSchema.parse(seller_id);

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .schema("app")
    .from("sku_costs")
    .select("*")
    .eq("seller_id", seller_id)
    .order("sku", { ascending: true });

  throwIfSupabaseError(error, "listSkuCosts");
  return (data ?? []) as SkuCost[];
}

export async function upsertSkuCost(input: { seller_id: number; sku: string; unit_cost: number }) {
  const parsed = skuCostUpsertSchema.parse(input);
  const admin = supabaseAdmin();

  const { data, error } = await admin
    .schema("app")
    .from("sku_costs")
    .upsert({ ...parsed, unit_cost: parsed.unit_cost }, { onConflict: "seller_id,sku" })
    .select("*")
    .single();

  throwIfSupabaseError(error, "upsertSkuCost");
  return data as SkuCost;
}

export async function deleteSkuCost(seller_id: number, sku: string) {
  sellerIdSchema.parse(seller_id);
  skuSchema.parse(sku);

  const admin = supabaseAdmin();
  const { error } = await admin
    .schema("app")
    .from("sku_costs")
    .delete()
    .eq("seller_id", seller_id)
    .eq("sku", sku);

  throwIfSupabaseError(error, "deleteSkuCost");
  return { ok: true };
}

export async function bulkUpsertSkuCosts(
  seller_id: number,
  rows: Array<{ sku: string; unit_cost: number }>
): Promise<{ ok: true; count: number }> {
  sellerIdSchema.parse(seller_id);

  // Validate each row using the canonical schema.
  const parsed = rows.map((r) => skuCostUpsertSchema.parse({ seller_id, sku: r.sku, unit_cost: r.unit_cost }));
  const admin = supabaseAdmin();

  const { error } = await admin
    .schema("app")
    .from("sku_costs")
    .upsert(parsed, { onConflict: "seller_id,sku" });

  throwIfSupabaseError(error, "bulkUpsertSkuCosts");
  return { ok: true, count: parsed.length };
}


export async function listSkuCostsBySkus(seller_id: number, skus: string[]): Promise<SkuCost[]> {
  sellerIdSchema.parse(seller_id);
  const uniq = Array.from(new Set((skus ?? []).map((s) => String(s).trim()).filter(Boolean)));
  if (!uniq.length) return [];

  const admin = supabaseAdmin();
  // PostgREST can handle IN lists, but keep it bounded.
  const chunks: string[][] = [];
  const size = 200;
  for (let i = 0; i < uniq.length; i += size) chunks.push(uniq.slice(i, i + size));

  const out: SkuCost[] = [];
  for (const c of chunks) {
    const { data, error } = await admin
      .schema("app")
      .from("sku_costs")
      .select("*")
      .eq("seller_id", seller_id)
      .in("sku", c);

    throwIfSupabaseError(error, "listSkuCostsBySkus");
    out.push(...((data ?? []) as SkuCost[]));
  }
  return out;
}
