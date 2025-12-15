import "server-only";

import { envServer, assertMlEnv } from "@/lib/env";
import type { MlOrder, MlOrderSearchResponse } from "@/lib/ml/types";
import { refreshMlAccessToken } from "@/lib/ml/auth";

function toIsoStart(dateStr: string) {
  // dateStr: YYYY-MM-DD
  return new Date(`${dateStr}T00:00:00.000Z`).toISOString();
}

function toIsoEnd(dateStr: string) {
  return new Date(`${dateStr}T23:59:59.999Z`).toISOString();
}

export type FetchOrdersParams = {
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  limit?: number; // default 50
  offset?: number; // default 0
};

export async function fetchMlOrdersPage(params: FetchOrdersParams): Promise<{ orders: MlOrder[]; total: number; limit: number; offset: number }> {
  assertMlEnv();
  const { accessToken } = await refreshMlAccessToken();

  const sellerId = envServer.mlSellerId;
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;

  const qs = new URLSearchParams();
  qs.set("seller", String(sellerId));
  qs.set("limit", String(limit));
  qs.set("offset", String(offset));
  qs.set("sort", "date_desc");

  // Date filters (best-effort). If ML rejects these params, we still return a meaningful error.
  if (params.from) qs.set("order.date_created.from", toIsoStart(params.from));
  if (params.to) qs.set("order.date_created.to", toIsoEnd(params.to));

  const url = `https://api.mercadolibre.com/orders/search?${qs.toString()}`;
  const resp = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  // Fallback: some accounts/regions may not accept date_created filters.
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");

    // Try again without date filters.
    const qs2 = new URLSearchParams();
    qs2.set("seller", String(sellerId));
    qs2.set("limit", String(limit));
    qs2.set("offset", String(offset));
    qs2.set("sort", "date_desc");

    const url2 = `https://api.mercadolibre.com/orders/search?${qs2.toString()}`;
    const resp2 = await fetch(url2, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!resp2.ok) {
      const text2 = await resp2.text().catch(() => "");
      throw new Error(`ML orders error ${resp2.status}: ${text2.slice(0, 500)} (first attempt: ${resp.status} ${text.slice(0, 200)})`);
    }

    const json2 = (await resp2.json()) as MlOrderSearchResponse;
    const orders = (json2.results ?? json2.orders ?? []) as MlOrder[];
    const paging = json2.paging ?? {};
    return { orders, total: paging.total ?? orders.length, limit: paging.limit ?? limit, offset: paging.offset ?? offset };
  }

  const json = (await resp.json()) as MlOrderSearchResponse;
  const orders = (json.results ?? json.orders ?? []) as MlOrder[];
  const paging = json.paging ?? {};
  return { orders, total: paging.total ?? orders.length, limit: paging.limit ?? limit, offset: paging.offset ?? offset };
}

export async function fetchMlOrdersAll(params: { from?: string; to?: string; maxPages?: number } = {}): Promise<MlOrder[]> {
  const maxPages = params.maxPages ?? 10; // safety: 10*50 = 500 orders
  const out: MlOrder[] = [];

  let offset = 0;
  let page = 0;
  let total = 1;
  while (offset < total && page < maxPages) {
    const { orders, total: t, limit } = await fetchMlOrdersPage({ from: params.from, to: params.to, offset, limit: 50 });
    out.push(...orders);
    total = t;
    offset += limit;
    page += 1;
    if (!orders.length) break;
  }

  return out;
}
