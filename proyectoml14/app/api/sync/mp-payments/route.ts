import { NextResponse } from "next/server";
import { syncPayments } from "@/lib/integrations/mercadopago";
import { parseMonthParam } from "@/lib/utils/format";

type Body = { month?: string; from?: string; to?: string };

function parseRange(body: Body | null): { from: Date; to: Date } {
  if (body?.from && body?.to) {
    return { from: new Date(`${body.from}T00:00:00.000Z`), to: new Date(`${body.to}T23:59:59.999Z`) };
  }
  const { from, to } = parseMonthParam(body?.month ?? null);
  return { from, to };
}

export async function POST(req: Request): Promise<NextResponse> {
  const body = (await req.json().catch(() => null)) as Body | null;
  const range = parseRange(body);
  const result = await syncPayments(range);
  return NextResponse.json({ ok: true, ...result });
}
