export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { envServer } from "@/lib/env";
import { deleteSkuCost } from "@/lib/db/skuCosts";

function parseSellerId(): number {
  const n = Number(envServer.mlSellerId);
  return Number.isFinite(n) && n > 0 ? n : 141795397;
}

const bodySchema = z.object({ sku: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const seller_id = parseSellerId();
    const json = await req.json();
    const parsed = bodySchema.parse(json);

    await deleteSkuCost(seller_id, parsed.sku);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = e?.message ? String(e.message) : "Unexpected error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
