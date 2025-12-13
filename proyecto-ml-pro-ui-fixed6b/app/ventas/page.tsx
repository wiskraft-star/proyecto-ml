"use client";

import { useMemo, useState } from "react";
import { salesMock, type SaleRow } from "@/lib/mock";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Drawer } from "@/components/ui/drawer";
import { ars } from "@/lib/format";

export default function VentasPage() {
  const rows = useMemo(() => salesMock(), []);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"Todos" | SaleRow["status"]>("Todos");
  const [picked, setPicked] = useState<SaleRow | null>(null);

  const filtered = rows.filter((r) => {
    const okStatus = status === "Todos" ? true : r.status === status;
    const hay = (r.orderId + " " + r.sku + " " + r.title).toLowerCase().includes(q.toLowerCase());
    return okStatus && hay;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Ventas"
          subtitle="Operación + desglose económico por orden (modo demo)."
          right={<Badge tone="neutral">{filtered.length} registros</Badge>}
        />
        <CardBody>
          <div className="grid gap-3 md:grid-cols-3">
            <Input placeholder="Buscar por orden, SKU, título…" value={q} onChange={(e) => setQ(e.target.value)} />
            <Select value={status} onChange={(e) => setStatus(e.target.value as any)}>
              <option>Todos</option>
              <option>Entregado</option>
              <option>En camino</option>
              <option>Devuelto</option>
              <option>Cancelado</option>
            </Select>
            <div className="text-sm text-muted md:text-right">
              Tip: click en una fila para ver “de dónde sale” el neto.
            </div>
          </div>

          <div className="mt-4">
            <Table>
              <THead>
                <TR className="border-t-0">
                  <TH>Orden</TH>
                  <TH>Fecha</TH>
                  <TH>SKU</TH>
                  <TH>Estado</TH>
                  <TH className="text-right">Bruto</TH>
                  <TH className="text-right">Comisiones</TH>
                  <TH className="text-right">Envío</TH>
                  <TH className="text-right">Ads</TH>
                  <TH className="text-right">Dev.</TH>
                  <TH className="text-right">Neto</TH>
                </TR>
              </THead>
              <tbody>
                {filtered.map((r) => (
                  <TR key={r.orderId} className="hover:bg-panel2/40 cursor-pointer" onClick={() => setPicked(r)}>
                    <TD className="font-medium">{r.orderId}</TD>
                    <TD className="text-muted">{r.date}</TD>
                    <TD>
                      <div className="font-medium">{r.sku}</div>
                      <div className="text-xs text-muted line-clamp-1">{r.title}</div>
                    </TD>
                    <TD>
                      <Badge tone={r.status === "Entregado" ? "good" : r.status === "Devuelto" ? "bad" : r.status === "Cancelado" ? "bad" : "warn"}>
                        {r.status}
                      </Badge>
                    </TD>
                    <TD className="text-right">{ars(r.gross)}</TD>
                    <TD className="text-right text-muted">{ars(r.fees)}</TD>
                    <TD className="text-right text-muted">{ars(r.shipping)}</TD>
                    <TD className="text-right text-muted">{ars(r.ads)}</TD>
                    <TD className="text-right text-muted">{ars(r.refunds)}</TD>
                    <TD className="text-right font-semibold">{ars(r.net)}</TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </div>
        </CardBody>
      </Card>

      <Drawer open={!!picked} onClose={() => setPicked(null)} title={picked ? `Orden ${picked.orderId}` : ""} width="max-w-2xl">
        {picked ? <OrderDetail row={picked} /> : null}
      </Drawer>
    </div>
  );
}

function OrderDetail({ row }: { row: SaleRow }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-panel2/30 p-4">
        <div className="text-sm font-semibold">{row.title}</div>
        <div className="mt-1 text-sm text-muted">SKU: {row.sku} · Cant: {row.qty} · Fecha: {row.date}</div>
      </div>

      <div className="rounded-2xl border border-border bg-panel2/30 p-4">
        <div className="text-sm font-semibold">Desglose económico</div>
        <div className="mt-3 grid gap-2 text-sm">
          <Line label="Bruto" value={row.gross} kind="pos" />
          <Line label="Comisiones" value={-row.fees} kind="neg" />
          <Line label="Envío" value={-row.shipping} kind="neg" />
          <Line label="Publicidad" value={-row.ads} kind="neg" />
          <Line label="Devolución (envío negativo)" value={-row.refunds} kind="neg" />
          <div className="mt-2 border-t border-border pt-2">
            <Line label="Neto" value={row.net} kind="total" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-panel2/30 p-4 text-sm text-muted">
        “De dónde sale”: este desglose viene de movimientos ML/MP clasificados + reglas de devoluciones. En integración real,
        se vincula por order_id/pack_id y tipos de movimiento.
      </div>
    </div>
  );
}

function Line({ label, value, kind }: { label: string; value: number; kind: "pos"|"neg"|"total" }) {
  const tone = kind === "total" ? "text-text" : value < 0 ? "text-muted" : "text-text";
  return (
    <div className="flex items-center justify-between">
      <div className="text-muted">{label}</div>
      <div className={`font-medium ${tone}`}>{ars(value)}</div>
    </div>
  );
}
