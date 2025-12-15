export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { envServer } from "@/lib/env";
import { upsertSupply } from "@/lib/db/supplies";

function parseSellerId(): number {
  const n = Number(envServer.mlSellerId);
  return Number.isFinite(n) && n > 0 ? n : 141795397;
}

const bodySchema = z.object({
  name: z.string().min(1).max(160),
  unit_cost: z.number().nonnegative(),
});

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const seller_id = parseSellerId();
    const json = await req.json();
    const parsed = bodySchema.parse(json);

    const row = await upsertSupply({ seller_id, ...parsed });
    return NextResponse.json({ ok: true, data: row });
  } catch (e: any) {
    const msg = e?.message ? String(e.message) : "Unexpected error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
