import "server-only";

import { supabaseAdmin } from "@/lib/db/client";
import { throwIfSupabaseError } from "@/lib/db/utils";
import { sellerIdSchema } from "@/lib/db/validators";
import type { SaleMarginRow } from "@/lib/db/types";

export type ListSaleMarginsParams = {
  seller_id: number;
  from?: string;
  to?: string;
  status?: string;
  limit?: number;
  offset?: number;
};

export async function listSaleMargins(params: ListSaleMarginsParams): Promise<SaleMarginRow[]> {
  sellerIdSchema.parse(params.seller_id);
  const admin = supabaseAdmin();

  let q = admin.schema("app").from("v_sale_margin").select("*").eq("seller_id", params.seller_id);
  if (params.status) q = q.ilike("status", params.status);
  if (params.from) q = q.gte("sold_at", params.from);
  if (params.to) q = q.lte("sold_at", params.to);
  q = q.order("sold_at", { ascending: false });
  if (typeof params.limit === "number") {
    const offset = params.offset ?? 0;
    q = q.range(offset, offset + params.limit - 1);
  }

  const { data, error } = await q;
  throwIfSupabaseError(error, "listSaleMargins");
  return (data ?? []) as SaleMarginRow[];
}
