export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { envServer } from "@/lib/env";
import { listSkuCosts } from "@/lib/db/skuCosts";

function parseSellerId(): number {
  const n = Number(envServer.mlSellerId);
  return Number.isFinite(n) && n > 0 ? n : 141795397;
}

function escapeCsvValue(value: string) {
  const v = value ?? "";
  if (/[\n\r",;]/.test(v)) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const seller_id = parseSellerId();
  const rows = await listSkuCosts(seller_id);

  const header = "sku,unit_cost";
  const lines = rows.map((r) => `${escapeCsvValue(r.sku)},${r.unit_cost}`);
  const csv = [header, ...lines].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename=sku_costs_${seller_id}.csv`,
      "cache-control": "no-store",
    },
  });
}
