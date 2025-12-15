export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { envServer } from "@/lib/env";
import { bulkUpsertSkuCosts, listSkuCosts } from "@/lib/db/skuCosts";

function parseSellerId(): number {
  const n = Number(envServer.mlSellerId);
  return Number.isFinite(n) && n > 0 ? n : 141795397;
}

const bodySchema = z.object({
  rows: z
    .array(
      z.object({
        sku: z.string().min(1),
        unit_cost: z.number().nonnegative(),
      })
    )
    .max(2000),
});

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const seller_id = parseSellerId();
    const json = await req.json();
    const parsed = bodySchema.parse(json);

    await bulkUpsertSkuCosts(seller_id, parsed.rows);
    const dataRows = await listSkuCosts(seller_id);

    return NextResponse.json({ ok: true, data: dataRows });
  } catch (e: any) {
    const msg = e?.message ? String(e.message) : "Unexpected error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
