import "server-only";

import { supabaseAdmin } from "@/lib/db/client";
import { throwIfSupabaseError } from "@/lib/db/utils";
import { saleItemInsertSchema, sellerIdSchema } from "@/lib/db/validators";
import type { SaleItem } from "@/lib/db/types";

export async function listSaleItemsBySale(seller_id: number, sale_id: string): Promise<SaleItem[]> {
  sellerIdSchema.parse(seller_id);
  const admin = supabaseAdmin();

  const { data, error } = await admin
    .schema("app")
    .from("sale_items")
    .select("*")
    .eq("seller_id", seller_id)
    .eq("sale_id", sale_id)
    .order("created_at", { ascending: true });

  throwIfSupabaseError(error, "listSaleItemsBySale");
  return (data ?? []) as SaleItem[];
}

export async function insertSaleItems(items: Array<{
  seller_id: number;
  sale_id: string;
  sku: string;
  title?: string | null;
  qty: number;
  source_raw?: unknown;
}>) {
  const parsed = items.map((it) => saleItemInsertSchema.parse(it));
  const admin = supabaseAdmin();

  const { data, error } = await admin.schema("app").from("sale_items").insert(parsed).select("*");
  throwIfSupabaseError(error, "insertSaleItems");
  return (data ?? []) as SaleItem[];
}

export async function deleteSaleItemsBySale(seller_id: number, sale_id: string) {
  sellerIdSchema.parse(seller_id);
  const admin = supabaseAdmin();
  const { error } = await admin
    .schema("app")
    .from("sale_items")
    .delete()
    .eq("seller_id", seller_id)
    .eq("sale_id", sale_id);
  throwIfSupabaseError(error, "deleteSaleItemsBySale");
  return { ok: true };
}

export async function listSaleItemsForSales(seller_id: number, sale_ids: string[]): Promise<SaleItem[]> {
  sellerIdSchema.parse(seller_id);
  const admin = supabaseAdmin();
  if (!sale_ids.length) return [];

  const { data, error } = await admin
    .schema("app")
    .from("sale_items")
    .select("*")
    .eq("seller_id", seller_id)
    .in("sale_id", sale_ids);

  throwIfSupabaseError(error, "listSaleItemsForSales");
  return (data ?? []) as SaleItem[];
}

export async function replaceSaleItemsBySale(
  seller_id: number,
  sale_id: string,
  items: Array<{ seller_id: number; sale_id: string; sku: string; title?: string | null; qty: number; source_raw?: unknown }>
) {
  // Best-effort idempotency: delete then insert.
  await deleteSaleItemsBySale(seller_id, sale_id);
  if (!items.length) return [] as SaleItem[];
  return insertSaleItems(items);
}
