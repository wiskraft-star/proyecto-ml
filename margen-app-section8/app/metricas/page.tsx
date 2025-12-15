import { requireUser } from "@/lib/auth";
import { envServer } from "@/lib/env";
import { listSaleMargins } from "@/lib/db/metrics";
import { listSaleItemsForSales } from "@/lib/db/saleItems";
import { listSkuCostsBySkus } from "@/lib/db/skuCosts";
import type { SaleItem, SaleMarginRow, SkuCost } from "@/lib/db/types";

function parseSellerId(): number {
  const n = Number(envServer.mlSellerId);
  return Number.isFinite(n) && n > 0 ? n : 141795397;
}

function toIsoStart(ymd: string) {
  return new Date(`${ymd}T00:00:00.000Z`).toISOString();
}

function toIsoEnd(ymd: string) {
  return new Date(`${ymd}T23:59:59.999Z`).toISOString();
}

function fmtDateTime(dt?: string | null) {
  if (!dt) return "-";
  try {
    const d = new Date(dt);
    return new Intl.DateTimeFormat("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dt;
  }
}

function num(v: string | null | undefined): number {
  if (v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtMoney(v: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(v);
}

function fmtPercent(v: number) {
  return `${(v * 100).toFixed(2)}%`;
}

function groupItems(items: SaleItem[]) {
  const map = new Map<string, SaleItem[]>();
  for (const it of items) {
    const arr = map.get(it.sale_id) ?? [];
    arr.push(it);
    map.set(it.sale_id, arr);
  }
  return map;
}

function buildCostMap(costs: SkuCost[]) {
  const map = new Map<string, number>();
  for (const c of costs) map.set(c.sku, num(c.unit_cost));
  return map;
}

function buildMissingBySale(itemsBySale: Map<string, SaleItem[]>, costMap: Map<string, number>) {
  const missing = new Map<string, string[]>();
  for (const [saleId, items] of itemsBySale.entries()) {
    const miss: string[] = [];
    for (const it of items) {
      if (!costMap.has(it.sku)) miss.push(it.sku);
    }
    if (miss.length) missing.set(saleId, Array.from(new Set(miss)));
  }
  return missing;
}

type SearchParams = { from?: string; to?: string; status?: string };

export default async function MetricasPage({ searchParams }: { searchParams?: SearchParams }) {
  await requireUser();

  const seller_id = parseSellerId();

  const fromIso = searchParams?.from ? toIsoStart(searchParams.from) : undefined;
  const toIso = searchParams?.to ? toIsoEnd(searchParams.to) : undefined;
  const statusFilter = (searchParams?.status ?? "").trim();

  const rows: SaleMarginRow[] = await listSaleMargins({
    seller_id,
    from: fromIso,
    to: toIso,
    status: statusFilter || undefined,
    limit: 200,
  });

  const saleIds = rows.map((r) => r.sale_id);
  const items = saleIds.length ? await listSaleItemsForSales(seller_id, saleIds) : [];
  const itemsBySale = groupItems(items);

  const distinctSkus = Array.from(new Set(items.map((it) => it.sku))).slice(0, 2000);
  const costs = distinctSkus.length ? await listSkuCostsBySkus(seller_id, distinctSkus) : [];
  const costMap = buildCostMap(costs);
  const missingBySale = buildMissingBySale(itemsBySale, costMap);

  const rowsWithNet = rows.filter((r) => r.net_amount !== null);
  const netTotal = rowsWithNet.reduce((a, r) => a + num(r.net_amount), 0);
  const cogsTotal = rowsWithNet.reduce((a, r) => a + num(r.cogs), 0);
  const suppliesTotal = rowsWithNet.reduce((a, r) => a + num(r.supplies), 0);
  const marginTotal = rowsWithNet.reduce((a, r) => a + num(r.margin), 0);
  const marginPct = netTotal > 0 ? marginTotal / netTotal : 0;

  const missingNetCount = rows.filter((r) => r.net_amount === null).length;
  const missingCostSalesCount = Array.from(missingBySale.keys()).length;

  const distinctStatuses = Array.from(new Set(rows.map((r) => r.status).filter(Boolean))).slice(0, 25) as string[];

  return (
    <main>
      <section className="card">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="h1">Métricas</div>
            <div className="small">Fuente: app.v_sale_margin (seller_id {seller_id})</div>
          </div>
          <div className="small">Máx 200 filas</div>
        </div>

        <div className="card" style={{ marginTop: 12 }}>
          <form method="GET" className="row" style={{ alignItems: "flex-end" }}>
            <div style={{ width: 180 }}>
              <label className="label">Desde</label>
              <input className="input" type="date" name="from" defaultValue={searchParams?.from ?? ""} />
            </div>
            <div style={{ width: 180 }}>
              <label className="label">Hasta</label>
              <input className="input" type="date" name="to" defaultValue={searchParams?.to ?? ""} />
            </div>
            <div style={{ width: 220 }}>
              <label className="label">Estado</label>
              <input
                className="input"
                list="status-list"
                name="status"
                placeholder="Ej: paid, cancelled"
                defaultValue={searchParams?.status ?? ""}
              />
              <datalist id="status-list">
                {distinctStatuses.map((st) => (
                  <option key={st} value={st} />
                ))}
              </datalist>
            </div>
            <button className="btn" type="submit">Filtrar</button>
            <a className="btn" href="/metricas">Limpiar</a>
          </form>
        </div>
      </section>

      <section className="grid2" style={{ marginTop: 12 }}>
        <div className="card">
          <div className="h2">Facturación neta (MP)</div>
          <div className="h1" style={{ marginTop: 0 }}>{fmtMoney(netTotal)}</div>
          <div className="small">Ventas con cobro: {rowsWithNet.length} / {rows.length}</div>
        </div>

        <div className="card">
          <div className="h2">Margen total</div>
          <div className="h1" style={{ marginTop: 0 }}>{fmtMoney(marginTotal)}</div>
          <div className="small">Margen % (sobre neto): {fmtPercent(marginPct)}</div>
        </div>

        <div className="card">
          <div className="h2">COGS total</div>
          <div className="h1" style={{ marginTop: 0 }}>{fmtMoney(cogsTotal)}</div>
          <div className="small">Faltan costos SKU en {missingCostSalesCount} ventas</div>
        </div>

        <div className="card">
          <div className="h2">Insumos total</div>
          <div className="h1" style={{ marginTop: 0 }}>{fmtMoney(suppliesTotal)}</div>
          <div className="small">Sin cobro detectado en {missingNetCount} ventas</div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 12 }}>
        <div className="h2">Ventas con margen</div>

        <div className="tableWrap" style={{ marginTop: 12 }}>
          <table className="table" style={{ minWidth: 1100 }}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Estado</th>
                <th>IDs</th>
                <th>Neto</th>
                <th>COGS</th>
                <th>Insumos</th>
                <th>Margen</th>
                <th>Alertas</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: SaleMarginRow) => {
                const net = r.net_amount ? num(r.net_amount) : 0;
                const margin = r.margin ? num(r.margin) : 0;
                const mpct = net > 0 ? margin / net : 0;
                const missingSkus = missingBySale.get(r.sale_id) ?? [];
                const alerts: string[] = [];
                if (!r.net_amount) alerts.push("Sin cobro MP");
                if (missingSkus.length) alerts.push(`Faltan costos SKU: ${missingSkus.slice(0, 8).join(", ")}${missingSkus.length > 8 ? "…" : ""}`);
                if (num(r.supplies) === 0) alerts.push("Insumos=0 (revisar receta)");

                return (
                  <tr key={r.sale_id}>
                    <td>{fmtDateTime(r.sold_at)}</td>
                    <td>{r.status}</td>
                    <td>
                      <div className="small">Order: <span className="mono">{r.order_id ?? "-"}</span></div>
                      <div className="small">Pack: <span className="mono">{r.pack_id ?? "-"}</span></div>
                      <div className="small">Eco: <span className="mono">{r.economic_id}</span></div>
                    </td>
                    <td>{r.net_amount ? fmtMoney(num(r.net_amount)) : "-"}</td>
                    <td>{fmtMoney(num(r.cogs))}</td>
                    <td>{fmtMoney(num(r.supplies))}</td>
                    <td>
                      {r.margin ? (
                        <>
                          <div>{fmtMoney(margin)}</div>
                          <div className="small">{fmtPercent(mpct)}</div>
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>
                      {alerts.length ? (
                        <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
                          {alerts.map((a) => (
                            <li key={a}>{a}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="small">OK</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!rows.length ? (
                <tr>
                  <td colSpan={8} className="small">Sin datos. Primero sincronizá Ventas y Cobros.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <p className="small" style={{ marginTop: 12 }}>
          Esta vista usa el match de cobros (economic_id / pack_id / order_id) definido en <span className="mono">app.v_net_per_sale</span>.
          Si ves "Sin cobro MP", corré Sync Cobros o revisá si la venta todavía no fue acreditada.
        </p>
      </section>
    </main>
  );
}
