import "server-only";

import { supabaseAdmin } from "@/lib/db/client";
import { throwIfSupabaseError } from "@/lib/db/utils";
import { paymentUpsertSchema, sellerIdSchema } from "@/lib/db/validators";
import type { Payment } from "@/lib/db/types";

export type ListPaymentsParams = {
  seller_id: number;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
};

export async function listPayments(params: ListPaymentsParams): Promise<Payment[]> {
  sellerIdSchema.parse(params.seller_id);
  const admin = supabaseAdmin();

  let q = admin.schema("app").from("payments").select("*").eq("seller_id", params.seller_id);
  if (params.from) q = q.gte("paid_at", params.from);
  if (params.to) q = q.lte("paid_at", params.to);
  q = q.order("paid_at", { ascending: false });
  if (typeof params.limit === "number") {
    const offset = params.offset ?? 0;
    q = q.range(offset, offset + params.limit - 1);
  }

  const { data, error } = await q;
  throwIfSupabaseError(error, "listPayments");
  return (data ?? []) as Payment[];
}

export async function searchPayments(params: {
  seller_id: number;
  query: string;
  limit?: number;
}): Promise<Payment[]> {
  sellerIdSchema.parse(params.seller_id);
  const qstr = (params.query ?? "").trim();
  if (!qstr) return [];

  const admin = supabaseAdmin();
  const like = `%${qstr.replace(/%/g, "").replace(/_/g, "")}%`;

  let q = admin
    .schema("app")
    .from("payments")
    .select("*")
    .eq("seller_id", params.seller_id)
    .or(`economic_id.ilike.${like},order_id.ilike.${like},pack_id.ilike.${like}`)
    .order("paid_at", { ascending: false });

  if (typeof params.limit === "number") {
    q = q.range(0, params.limit - 1);
  }

  const { data, error } = await q;
  throwIfSupabaseError(error, "searchPayments");
  return (data ?? []) as Payment[];
}

export async function upsertPayment(input: {
  seller_id: number;
  mp_payment_id: string;
  economic_id?: string | null;
  order_id?: string | null;
  pack_id?: string | null;
  paid_at?: string | null;
  gross_amount?: number | null;
  fees_amount?: number | null;
  net_amount: number;
  source_raw?: unknown;
}) {
  const parsed = paymentUpsertSchema.parse(input);
  const admin = supabaseAdmin();

  const { data, error } = await admin
    .schema("app")
    .from("payments")
    .upsert(
      {
        ...parsed,
        gross_amount: parsed.gross_amount ?? null,
        fees_amount: parsed.fees_amount ?? null,
        paid_at: parsed.paid_at ?? null,
      },
      { onConflict: "seller_id,mp_payment_id" }
    )
    .select("*")
    .single();

  throwIfSupabaseError(error, "upsertPayment");
  return data as Payment;
}
