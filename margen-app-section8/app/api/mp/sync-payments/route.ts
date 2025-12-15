export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { envServer, assertMpEnv } from "@/lib/env";
import { fetchMpPaymentsAll } from "@/lib/mp/payments";
import { upsertPayment } from "@/lib/db/payments";
import { dbLog } from "@/lib/db/log";

function parseSellerId(): number {
  const n = Number(envServer.mlSellerId);
  if (!Number.isFinite(n) || n <= 0) throw new Error("Invalid ML_SELLER_ID (used as seller_id for MP)");
  return n;
}

function ymdFromDate(d: Date): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function sumFees(feeDetails: Array<{ amount?: number }> | undefined): number {
  if (!Array.isArray(feeDetails)) return 0;
  return feeDetails.reduce((acc, f) => acc + (typeof f?.amount === "number" ? f.amount : 0), 0);
}

function pickString(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

export async function POST(req: Request) {
  try {
    // Verify session
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Rate limit (per user + route)
    const rl = rateLimit({
      key: `${data.user.id}://api/mp/sync-payments`,
      capacity: 10,
      refillPerSecond: 0.2,
    });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Rate limit exceeded", retry_after_seconds: rl.retryAfterSeconds },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds), "Cache-Control": "no-store" } }
      );
    }

    assertMpEnv();
    const seller_id = parseSellerId();

    const body = (await req.json().catch(() => ({}))) as {
      from?: string; // YYYY-MM-DD
      to?: string; // YYYY-MM-DD
      days?: number;
      status?: string; // e.g. approved
    };

    const now = new Date();
    const to = body.to ?? ymdFromDate(now);
    const from = body.from ?? ymdFromDate(new Date(now.getTime() - (body.days ?? 30) * 24 * 60 * 60 * 1000));
    const status = body.status ?? "approved";

    dbLog.info("syncPayments:start", { seller_id, from, to, status });

    const payments = await fetchMpPaymentsAll({ from, to, status, maxPages: 30 });

    let paymentsUpserted = 0;
    const payErrors: Array<{ id: string; error: string }> = [];

    for (const p of payments) {
      try {
        const mp_payment_id = pickString((p as any).id);
        if (!mp_payment_id) throw new Error("Missing payment id");

        const paid_at = pickString((p as any).date_approved) ?? pickString((p as any).date_created);
        const gross = typeof (p as any).transaction_amount === "number" ? (p as any).transaction_amount : null;
        const fees = sumFees((p as any).fee_details);
        const netFromApi = (p as any).transaction_details?.net_received_amount;
        const net = typeof netFromApi === "number" ? netFromApi : (gross != null ? gross - fees : null);
        if (net == null || !Number.isFinite(net)) throw new Error("Cannot compute net_amount");

        // Linking fields (best effort): external_reference / metadata / order.id
        const external_reference = pickString((p as any).external_reference);
        const order_id = pickString((p as any).metadata?.order_id) ?? pickString((p as any).order?.id);
        const pack_id = pickString((p as any).metadata?.pack_id) ?? pickString((p as any).metadata?.packId);

        await upsertPayment({
          seller_id,
          mp_payment_id,
          economic_id: external_reference,
          order_id,
          pack_id,
          paid_at,
          gross_amount: gross,
          fees_amount: fees,
          net_amount: net,
          source_raw: p,
        });
        paymentsUpserted += 1;
      } catch (e: any) {
        payErrors.push({ id: String((p as any).id ?? "?"), error: e?.message ? String(e.message) : "Unknown error" });
      }
    }

    const result = {
      ok: true,
      seller_id,
      from,
      to,
      status,
      fetched_payments: payments.length,
      payments_upserted: paymentsUpserted,
      errors: payErrors.slice(0, 50),
    };

    dbLog.info("syncPayments:done", { ...result, errors_count: payErrors.length });
    return NextResponse.json(result);
  } catch (e: any) {
    dbLog.error("syncPayments:fail", { message: e?.message ?? String(e) });
    return NextResponse.json({ ok: false, error: e?.message ? String(e.message) : "Unknown error" }, { status: 500 });
  }
}
