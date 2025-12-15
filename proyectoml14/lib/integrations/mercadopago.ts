import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";

type SyncRange = { from: Date; to: Date };

type MpFeeDetail = { amount?: number | null };
type MpTransactionDetails = { net_received_amount?: number | null };

type MpPayment = {
  id?: number | string;
  date_approved?: string | null;
  date_created?: string | null;
  transaction_amount?: number | null;
  fee_details?: MpFeeDetail[] | null;
  transaction_details?: MpTransactionDetails | null;
  external_reference?: string | null;
  metadata?: Record<string, unknown> | null;
  merchant_order_id?: number | string | null;
};

type MpSearchResponse = {
  results?: MpPayment[];
  paging?: { total: number; offset: number; limit: number };
};

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function sumFees(fees: MpFeeDetail[] | null | undefined): number {
  if (!fees) return 0;
  return fees.reduce((acc, f) => acc + Number(f.amount ?? 0), 0);
}

function computeNet(p: MpPayment): { net: number; gross: number; fees: number } {
  const gross = Number(p.transaction_amount ?? 0);
  const fees = sumFees(p.fee_details);
  const netFromApi = p.transaction_details?.net_received_amount;
  const net = typeof netFromApi === "number" ? netFromApi : gross - fees;
  return { net, gross, fees };
}

function asString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return null;
}

function pickMeta(meta: Record<string, unknown> | null | undefined, key: string): string | null {
  if (!meta) return null;
  return asString(meta[key]);
}

function parseEconomicIdFromReference(ref: string | null | undefined): string | null {
  if (!ref) return null;
  const s = ref.trim();
  if (/^\d{6,}$/.test(s)) return s;
  const m = s.match(/(\d{6,})/);
  return m ? m[1] : null;
}

function deriveLinking(p: MpPayment): { economicId: string | null; orderId: string | null; packId: string | null } {
  const meta = p.metadata ?? null;
  const metaPack = pickMeta(meta, "pack_id");
  const metaOrder = pickMeta(meta, "order_id");
  const metaEconomic = pickMeta(meta, "economic_id");
  const ext = parseEconomicIdFromReference(p.external_reference ?? null);
  const merchantOrder = asString(p.merchant_order_id);

  const economicId = metaEconomic ?? metaPack ?? metaOrder ?? ext ?? null;
  const orderId = metaOrder ?? merchantOrder ?? null;
  const packId = metaPack ?? null;

  return { economicId, orderId, packId };
}

export async function syncPayments(range: SyncRange): Promise<{ upserted: number; unlinked: number }> {
  const token = requiredEnv("MP_ACCESS_TOKEN");
  const limit = 50;
  let offset = 0;
  let upserted = 0;
  let unlinked = 0;

  while (true) {
    const url = new URL("https://api.mercadopago.com/v1/payments/search");
    url.searchParams.set("range", "date_approved");
    url.searchParams.set("begin_date", range.from.toISOString());
    url.searchParams.set("end_date", range.to.toISOString());
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(offset));

    const resp = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`MP payments error ${resp.status}: ${t}`);
    }

    const data = (await resp.json()) as MpSearchResponse;
    const results = data.results ?? [];
    if (results.length === 0) break;

    for (const p of results) {
      const mpPaymentId = asString(p.id);
      const paidAtRaw = p.date_approved ?? p.date_created ?? null;
      const paidAt = paidAtRaw ? new Date(paidAtRaw) : null;

      const { net, gross, fees } = computeNet(p);
      const link = deriveLinking(p);
      if (!link.economicId) unlinked += 1;

      if (mpPaymentId) {
        await prisma.payment.upsert({
          where: { mpPaymentId },
          create: {
            mpPaymentId,
            economicId: link.economicId,
            orderId: link.orderId,
            packId: link.packId,
            netAmount: new Prisma.Decimal(net),
            grossAmount: new Prisma.Decimal(gross),
            feesAmount: new Prisma.Decimal(fees),
            paidAt,
            sourceRaw: (p as unknown) as Prisma.JsonObject,
          },
          update: {
            economicId: link.economicId,
            orderId: link.orderId,
            packId: link.packId,
            netAmount: new Prisma.Decimal(net),
            grossAmount: new Prisma.Decimal(gross),
            feesAmount: new Prisma.Decimal(fees),
            paidAt,
            sourceRaw: (p as unknown) as Prisma.JsonObject,
          },
        });
      } else {
        await prisma.payment.create({
          data: {
            mpPaymentId: null,
            economicId: link.economicId,
            orderId: link.orderId,
            packId: link.packId,
            netAmount: new Prisma.Decimal(net),
            grossAmount: new Prisma.Decimal(gross),
            feesAmount: new Prisma.Decimal(fees),
            paidAt,
            sourceRaw: (p as unknown) as Prisma.JsonObject,
          },
        });
      }
      upserted += 1;
    }

    const paging = data.paging;
    if (!paging) break;
    offset += paging.limit ?? limit;
    if (offset >= (paging.total ?? 0)) break;
  }

  return { upserted, unlinked };
}
