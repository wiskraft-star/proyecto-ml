import { prisma } from "@/lib/db/prisma";

type MlTokenResponse = { access_token: string };

type SyncRange = { from: Date; to: Date };

type MlOrderItem = {
  item?: { id?: string; title?: string; seller_sku?: string; seller_custom_field?: string };
  quantity?: number;
};

type MlOrder = {
  id: number;
  date_created: string;
  status: string;
  pack_id?: number | null;
  order_items?: MlOrderItem[];
};

type MlOrdersSearchResponse = {
  results: MlOrder[];
  paging?: { total: number; offset: number; limit: number };
};

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function refreshAccessToken(): Promise<string> {
  const url = "https://api.mercadolibre.com/oauth/token";
  const body = new URLSearchParams();
  body.set("grant_type", "refresh_token");
  body.set("client_id", requiredEnv("ML_CLIENT_ID"));
  body.set("client_secret", requiredEnv("ML_CLIENT_SECRET"));
  body.set("refresh_token", requiredEnv("ML_REFRESH_TOKEN"));

  const resp = await fetch(url, { method: "POST", body, headers: { "Content-Type": "application/x-www-form-urlencoded" } });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`ML token error ${resp.status}: ${t}`);
  }
  const data = (await resp.json()) as MlTokenResponse;
  return data.access_token;
}

function extractSku(orderItem: MlOrderItem): string {
  const item = orderItem.item;
  if (!item) return "UNKNOWN";
  const sku = item.seller_sku ?? item.seller_custom_field ?? item.id ?? "UNKNOWN";
  return String(sku);
}

export async function syncSales(range: SyncRange): Promise<{ upserted: number }> {
  const accessToken = await refreshAccessToken();
  const sellerId = requiredEnv("ML_SELLER_ID");

  const limit = 50;
  let offset = 0;
  let upserted = 0;

  while (true) {
    const url = new URL("https://api.mercadolibre.com/orders/search");
    url.searchParams.set("seller", sellerId);
    url.searchParams.set("order.date_created.from", range.from.toISOString());
    url.searchParams.set("order.date_created.to", range.to.toISOString());
    url.searchParams.set("sort", "date_desc");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(offset));

    const resp = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`ML orders error ${resp.status}: ${t}`);
    }

    const data = (await resp.json()) as MlOrdersSearchResponse;
    const results = data.results ?? [];
    if (results.length === 0) break;

    for (const o of results) {
      const orderId = String(o.id);
      const packId = o.pack_id ? String(o.pack_id) : null;
      const economicId = packId ?? orderId;

      const sale = await prisma.sale.upsert({
        where: { economicId },
        create: {
          economicId,
          orderId,
          packId,
          date: new Date(o.date_created),
          status: o.status ?? "unknown",
          items: {
            create: (o.order_items ?? []).map((it) => ({
              sku: extractSku(it),
              title: it.item?.title ?? null,
              qty: Number(it.quantity ?? 0),
            })),
          },
        },
        update: {
          orderId,
          packId,
          date: new Date(o.date_created),
          status: o.status ?? "unknown",
        },
      });

      await prisma.saleItem.deleteMany({ where: { saleId: sale.id } });
      await prisma.saleItem.createMany({
        data: (o.order_items ?? []).map((it) => ({
          saleId: sale.id,
          sku: extractSku(it),
          title: it.item?.title ?? null,
          qty: Number(it.quantity ?? 0),
        })),
      });

      upserted += 1;
    }

    const paging = data.paging;
    if (!paging) break;
    offset += paging.limit ?? limit;
    if (offset >= (paging.total ?? 0)) break;
  }

  return { upserted };
}
