import { requireUser } from "@/lib/auth";
import { envServer } from "@/lib/env";
import { listPayments, searchPayments } from "@/lib/db/payments";
import type { Payment } from "@/lib/db/types";
import { SyncPaymentsButton } from "@/components/SyncPaymentsButton";

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

function toNum(n: string | number | null | undefined): number {
  if (typeof n === "number") return n;
  if (typeof n === "string") {
    const v = Number(n);
    return Number.isFinite(v) ? v : 0;
  }
  return 0;
}

function fmtMoney(n: string | number | null | undefined) {
  const v = toNum(n);
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(v);
}

export default async function CobrosPage({
  searchParams,
}: {
  searchParams?: { from?: string; to?: string; q?: string };
}) {
  await requireUser();

  const seller_id = parseSellerId();
  const q = (searchParams?.q ?? "").trim();

  const from = searchParams?.from ? toIsoStart(searchParams.from) : undefined;
  const to = searchParams?.to ? toIsoEnd(searchParams.to) : undefined;

  const rows: Payment[] = q
    ? await searchPayments({ seller_id, query: q, limit: 200 })
    : await listPayments({ seller_id, from, to, limit: 200 });

  return (
    <main className="card">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="h1">Cobros</div>
          <div className="small">Fuente: Mercado Pago → app.payments (seller_id {seller_id})</div>
        </div>
        <SyncPaymentsButton days={30} />
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
          <div style={{ flex: 1, minWidth: 260 }}>
            <label className="label">Buscar (economic_id / pack_id / order_id)</label>
            <input className="input" type="text" name="q" placeholder="Ej: 2000010..." defaultValue={searchParams?.q ?? ""} />
          </div>
          <button className="btn" type="submit">
            Filtrar
          </button>
          <a className="btn" href="/cobros">
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
              <th>MP Payment</th>
              <th>Economic</th>
              <th>Order</th>
              <th>Pack</th>
              <th>Bruto</th>
              <th>Fees</th>
              <th>Neto</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>{fmt(p.paid_at)}</td>
                <td className="mono">{p.mp_payment_id}</td>
                <td className="mono">{p.economic_id ?? "-"}</td>
                <td className="mono">{p.order_id ?? "-"}</td>
                <td className="mono">{p.pack_id ?? "-"}</td>
                <td>{p.gross_amount == null ? "-" : fmtMoney(p.gross_amount)}</td>
                <td>{p.fees_amount == null ? "-" : fmtMoney(p.fees_amount)}</td>
                <td><strong>{fmtMoney(p.net_amount)}</strong></td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={8} className="small">
                  Sin datos. Probá "Sync Cobros".
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="small" style={{ marginTop: 12 }}>
        Nota: el sync usa <span className="mono">MP_ACCESS_TOKEN</span> en el servidor. El link con ventas se hace vía la vista
        <span className="mono"> app.v_net_per_sale</span> (economic_id / pack_id / order_id).
      </p>
    </main>
  );
}
