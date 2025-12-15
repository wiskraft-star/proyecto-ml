export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { envServer, assertMlEnv } from "@/lib/env";
import { fetchMlOrdersAll } from "@/lib/ml/orders";
import { upsertSale } from "@/lib/db/sales";
import { replaceSaleItemsBySale } from "@/lib/db/saleItems";
import { dbLog } from "@/lib/db/log";

function parseSellerId(): number {
  const n = Number(envServer.mlSellerId);
  if (!Number.isFinite(n) || n <= 0) throw new Error("Invalid ML_SELLER_ID");
  return n;
}

function ymdFromDate(d: Date): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function POST(req: Request) {
  try {
    // Verify session (protected route, but we re-check here).
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Rate limit (per user + route)
    const rl = rateLimit({
      key: `${data.user.id}://api/ml/sync-sales`,
      capacity: 10,
      refillPerSecond: 0.2,
    });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Rate limit exceeded", retry_after_seconds: rl.retryAfterSeconds },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds), "Cache-Control": "no-store" } }
      );
    }

    assertMlEnv();
    const seller_id = parseSellerId();

    const body = (await req.json().catch(() => ({}))) as {
      from?: string; // YYYY-MM-DD
      to?: string; // YYYY-MM-DD
      days?: number; // convenience
    };

    const now = new Date();
    const to = body.to ?? ymdFromDate(now);
    const from = body.from ?? ymdFromDate(new Date(now.getTime() - (body.days ?? 30) * 24 * 60 * 60 * 1000));

    dbLog.info("syncSales:start", { seller_id, from, to });

    const orders = await fetchMlOrdersAll({ from, to, maxPages: 20 });

    let salesUpserted = 0;
    let itemsReplaced = 0;
    const orderErrors: Array<{ id: string; error: string }> = [];

    for (const o of orders) {
      try {
        const orderIdStr = String(o.id);
        const soldAt = o.date_closed || o.date_created || new Date().toISOString();
        const status = o.status || "unknown";
        const packId = o.pack_id != null ? String(o.pack_id) : null;

        const sale = await upsertSale({
          seller_id,
          economic_id: orderIdStr,
          order_id: orderIdStr,
          pack_id: packId,
          sold_at: soldAt,
          status,
          source_raw: o,
        });
        salesUpserted += 1;

        const items = (o.order_items ?? [])
          .map((it) => {
            const sku = it.item?.seller_sku || it.item?.id;
            const qty = Number(it.quantity ?? 0);
            if (!sku || !Number.isFinite(qty) || qty <= 0) return null;
            return {
              seller_id,
              sale_id: sale.id,
              sku: String(sku),
              title: it.item?.title ?? null,
              qty,
              source_raw: it,
            };
          })
          .filter(Boolean) as Array<{ seller_id: number; sale_id: string; sku: string; title?: string | null; qty: number; source_raw?: unknown }>;

        await replaceSaleItemsBySale(seller_id, sale.id, items);
        itemsReplaced += 1;
      } catch (e: any) {
        orderErrors.push({ id: String(o.id), error: e?.message ? String(e.message) : "Unknown error" });
      }
    }

    const result = {
      ok: true,
      seller_id,
      from,
      to,
      fetched_orders: orders.length,
      sales_upserted: salesUpserted,
      sale_items_replaced: itemsReplaced,
      errors: orderErrors.slice(0, 50),
    };

    dbLog.info("syncSales:done", { ...result, errors_count: orderErrors.length });
    return NextResponse.json(result);
  } catch (e: any) {
    dbLog.error("syncSales:fail", { message: e?.message ?? String(e) });
    return NextResponse.json({ ok: false, error: e?.message ? String(e.message) : "Unknown error" }, { status: 500 });
  }
}
