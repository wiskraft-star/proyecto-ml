export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { envServer } from "@/lib/env";
import { listSupplies } from "@/lib/db/supplies";

function parseSellerId(): number {
  const n = Number(envServer.mlSellerId);
  return Number.isFinite(n) && n > 0 ? n : 141795397;
}

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const seller_id = parseSellerId();
    const rows = await listSupplies(seller_id);
    return NextResponse.json({ ok: true, data: rows });
  } catch (e: any) {
    const msg = e?.message ? String(e.message) : "Unexpected error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
