import "server-only";

import { envServer, assertMpEnv } from "@/lib/env";
import type { MpPayment, MpPaymentSearchResponse } from "@/lib/mp/types";

function toIsoStart(dateStr: string) {
  // dateStr: YYYY-MM-DD
  return new Date(`${dateStr}T00:00:00.000Z`).toISOString();
}

function toIsoEnd(dateStr: string) {
  return new Date(`${dateStr}T23:59:59.999Z`).toISOString();
}

export type FetchMpPaymentsParams = {
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  status?: string; // e.g. approved
  limit?: number;
  offset?: number;
};

export async function fetchMpPaymentsPage(
  params: FetchMpPaymentsParams
): Promise<{ payments: MpPayment[]; total: number; limit: number; offset: number }> {
  assertMpEnv();

  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;

  const qs = new URLSearchParams();
  qs.set("sort", "date_created");
  qs.set("criteria", "desc");
  qs.set("limit", String(limit));
  qs.set("offset", String(offset));

  // Date filters
  if (params.from) {
    qs.set("range", "date_created");
    qs.set("begin_date", toIsoStart(params.from));
  }
  if (params.to) {
    qs.set("end_date", toIsoEnd(params.to));
  }

  if (params.status) {
    qs.set("status", params.status);
  }

  const url = `https://api.mercadopago.com/v1/payments/search?${qs.toString()}`;
  const resp = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${envServer.mpAccessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`MP payments search error ${resp.status}: ${text.slice(0, 700)}`);
  }

  const json = (await resp.json()) as MpPaymentSearchResponse;
  const payments = (json.results ?? []) as MpPayment[];
  const paging = json.paging ?? {};
  return { payments, total: paging.total ?? payments.length, limit: paging.limit ?? limit, offset: paging.offset ?? offset };
}

export async function fetchMpPaymentsAll(
  params: { from?: string; to?: string; status?: string; maxPages?: number } = {}
): Promise<MpPayment[]> {
  const maxPages = params.maxPages ?? 20; // safety: 20*50 = 1000
  const out: MpPayment[] = [];

  let offset = 0;
  let page = 0;
  let total = 1;
  while (offset < total && page < maxPages) {
    const { payments, total: t, limit } = await fetchMpPaymentsPage({
      from: params.from,
      to: params.to,
      status: params.status,
      offset,
      limit: 50,
    });
    out.push(...payments);
    total = t;
    offset += limit;
    page += 1;
    if (!payments.length) break;
  }

  return out;
}
