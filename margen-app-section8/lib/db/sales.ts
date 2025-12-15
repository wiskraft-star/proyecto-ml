import "server-only";

import { supabaseAdmin } from "@/lib/db/client";
import { throwIfSupabaseError } from "@/lib/db/utils";
import { saleUpsertSchema, sellerIdSchema } from "@/lib/db/validators";
import type { Sale } from "@/lib/db/types";

export type ListSalesParams = {
  seller_id: number;
  from?: string; // ISO
  to?: string; // ISO
  limit?: number;
  offset?: number;
};

export async function listSales(params: ListSalesParams): Promise<Sale[]> {
  sellerIdSchema.parse(params.seller_id);
  const admin = supabaseAdmin();

  let q = admin.schema("app").from("sales").select("*").eq("seller_id", params.seller_id);
  if (params.from) q = q.gte("sold_at", params.from);
  if (params.to) q = q.lte("sold_at", params.to);
  q = q.order("sold_at", { ascending: false });
  if (typeof params.limit === "number") {
    const offset = params.offset ?? 0;
    q = q.range(offset, offset + params.limit - 1);
  }

  const { data, error } = await q;
  throwIfSupabaseError(error, "listSales");
  return (data ?? []) as Sale[];
}

export async function upsertSale(input: {
  seller_id: number;
  economic_id: string;
  order_id?: string | null;
  pack_id?: string | null;
  sold_at: string;
  status: string;
  source_raw?: unknown;
}) {
  const parsed = saleUpsertSchema.parse(input);
  const admin = supabaseAdmin();

  // Idempotency strategy:
  // - If we have order_id, prefer upsert by (seller_id, order_id).
  //   This leverages the partial unique index sales_unique_order (WHERE order_id IS NOT NULL).
  // - Otherwise, fallback to (seller_id, economic_id).
  const onConflict = parsed.order_id ? "seller_id,order_id" : "seller_id,economic_id";

  const { data, error } = await admin.schema("app").from("sales").upsert(parsed, { onConflict }).select("*").single();

  throwIfSupabaseError(error, "upsertSale");
  return data as Sale;
}
