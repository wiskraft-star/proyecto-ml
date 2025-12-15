import { requireUser } from "@/lib/auth";
import { envServer } from "@/lib/env";
import { listSales } from "@/lib/db/sales";
import { listSaleItemsForSales } from "@/lib/db/saleItems";
import type { Sale, SaleItem } from "@/lib/db/types";
import { SyncSalesButton } from "@/components/SyncSalesButton";

function parseSellerId(): number {
  const n = Number(envServer.mlSellerId);
  return Number.isFinite(n) && n > 0 ? n : 141795397; // fallback to your default
}

function toIsoStart(ymd: string) {
  return new Date(`${ymd}T00:00:00.000Z`).toISOString();
}

function toIsoEnd(ymd: string) {
  return new Date(`${ymd}T23:59:59.999Z`).toISOString();
}

function fmt(dt?: string | null) {
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

function groupItems(items: SaleItem[]) {
  const map = new Map<string, SaleItem[]>();
  for (const it of items) {
    const arr = map.get(it.sale_id) ?? [];
    arr.push(it);
    map.set(it.sale_id, arr);
  }
  return map;
}

export default async function VentasPage({
  searchParams,
}: {
  searchParams?: { from?: string; to?: string; status?: string };
}) {
  await requireUser();

  const seller_id = parseSellerId();

  const from = searchParams?.from ? toIsoStart(searchParams.from) : undefined;
  const to = searchParams?.to ? toIsoEnd(searchParams.to) : undefined;
  const statusFilter = (searchParams?.status ?? "").trim();

  let sales = await listSales({ seller_id, from, to, limit: 200 });
  if (statusFilter) {
    sales = sales.filter((s) => (s.status ?? "").toLowerCase() === statusFilter.toLowerCase());
  }

  const saleIds = sales.map((s) => s.id);
  const items = await listSaleItemsForSales(seller_id, saleIds);
  const itemsBySale = groupItems(items);

  const distinctStatuses = Array.from(new Set(sales.map((s) => s.status).filter(Boolean))).slice(0, 25) as string[];

  return (
    <main className="card">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="h1">Ventas</div>
          <div className="small">Fuente: Mercado Libre → app.sales + app.sale_items (seller_id {seller_id})</div>
        </div>
        <SyncSalesButton days={30} />
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
          <button className="btn" type="submit">
            Filtrar
          </button>
          <a className="btn" href="/ventas">
            Limpiar
          </a>
          <span className="small">Máx 200 filas</span>
        </form>
      </div>

      <div className="tableWrap" style={{ marginTop: 12 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Order</th>
              <th>Pack</th>
              <th>Economic</th>
              <th>Items (SKU × qty)</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s: Sale) => {
              const its = itemsBySale.get(s.id) ?? [];
              const summary = its
                .map((it) => `${it.sku}×${it.qty}`)
                .slice(0, 6)
                .join(", ");
              return (
                <tr key={s.id}>
                  <td>{fmt(s.sold_at)}</td>
                  <td>{s.status}</td>
                  <td className="mono">{s.order_id ?? "-"}</td>
                  <td className="mono">{s.pack_id ?? "-"}</td>
                  <td className="mono">{s.economic_id}</td>
                  <td>
                    <div className="small">{summary || "-"}</div>
                    {its.length > 6 ? <div className="small">+{its.length - 6} más</div> : null}
                    {its.length ? (
                      <details style={{ marginTop: 6 }}>
                        <summary className="small">Ver detalle</summary>
                        <ul className="small" style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                          {its.map((it) => (
                            <li key={it.id}>
                              <span className="mono">{it.sku}</span> — {it.title ?? ""} — qty <strong>{it.qty}</strong>
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : null}
                  </td>
                </tr>
              );
            })}
            {!sales.length ? (
              <tr>
                <td colSpan={6} className="small">
                  Sin datos. Probá "Sync Ventas".
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="small" style={{ marginTop: 12 }}>
        Nota: el sync usa el refresh_token de ML en el servidor, y guarda el JSON crudo en <span className="mono">source_raw</span>.
      </p>
    </main>
  );
}
