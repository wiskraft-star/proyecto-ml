"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";

import { ars, compact } from "@/lib/format";
import { salesMock, type SaleRow } from "@/lib/mock";

type Move = { id: string; orderId: string; kind: "Venta" | "Comisión" | "Envío" | "Ads" | "Devolución" | "Ajuste"; amount: number; note?: string };

function buildMoves(rows: SaleRow[]): Move[] {
  const out: Move[] = [];
  for (const r of rows) {
    out.push({ id: `${r.orderId}-gross`, orderId: r.orderId, kind: "Venta", amount: r.gross, note: "Bruto" });
    if (r.fees) out.push({ id: `${r.orderId}-fee`, orderId: r.orderId, kind: "Comisión", amount: -Math.abs(r.fees) });
    if (r.shipping) out.push({ id: `${r.orderId}-ship`, orderId: r.orderId, kind: "Envío", amount: -Math.abs(r.shipping) });
    if (r.ads) out.push({ id: `${r.orderId}-ads`, orderId: r.orderId, kind: "Ads", amount: -Math.abs(r.ads) });
    if (r.refunds) out.push({ id: `${r.orderId}-ref`, orderId: r.orderId, kind: "Devolución", amount: -Math.abs(r.refunds) });
  }

  // Ajustes demo: notas de crédito / bonificaciones
  out.push({ id: "adj-ml-0001", orderId: rows[0]?.orderId ?? "2000010200016693", kind: "Ajuste", amount: 72_000, note: "Bonificación / nota de crédito (demo)" });
  out.push({ id: "adj-ml-0002", orderId: rows[3]?.orderId ?? "2000010135617651", kind: "Ajuste", amount: -18_000, note: "Cargo extra (demo)" });
  return out;
}

export default function MargenCobrosPage() {
  const rows = useMemo(() => salesMock(), []);
  const moves = useMemo(() => buildMoves(rows), [rows]);

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return rows;
    return rows.filter((r) => r.orderId.toLowerCase().includes(qq) || r.sku.toLowerCase().includes(qq) || r.title.toLowerCase().includes(qq));
  }, [rows, q]);

  const selectedMoves = useMemo(() => {
    if (!selected) return [] as Move[];
    return moves.filter((m) => m.orderId === selected);
  }, [moves, selected]);

  const computedNet = useMemo(() => {
    if (!selected) return 0;
    return selectedMoves.reduce((a, m) => a + m.amount, 0);
  }, [selectedMoves, selected]);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Cobros / Liquidaciones"
          subtitle="Esta pestaña es la “verdad financiera”: el neto real ‘te quedó’ por operación (pack/order) + movimientos vinculados (ajustes, bonificaciones, cargos)."
        />
        <CardBody>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por orden/pack, SKU, título…" className="md:w-[360px]" />
              <Badge tone="neutral">Operaciones: {filtered.length}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary">Importar liquidaciones</Button>
              <Button variant="primary">Conciliar</Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Neto por operación" subtitle="Cada fila corresponde a una operación (pack/order). Click para ver movimientos." />
        <CardBody>
          <Table>
            <THead>
              <TR>
                <TH>Operación</TH>
                <TH>SKU</TH>
                <TH className="text-right">Bruto</TH>
                <TH className="text-right">Comisiones</TH>
                <TH className="text-right">Envío</TH>
                <TH className="text-right">Ads</TH>
                <TH className="text-right">Devoluciones</TH>
                <TH className="text-right">Neto “te quedó”</TH>
              </TR>
            </THead>
            <tbody>
              {filtered.slice(0, 40).map((r) => (
                <TR
                  key={r.orderId + r.sku + r.date}
                  onClick={() => {
                    setSelected(r.orderId);
                    setOpen(true);
                  }}
                  className="cursor-pointer"
                >
                  <TD className="font-medium">{r.orderId}</TD>
                  <TD>
                    <div className="leading-tight">
                      <div className="font-medium">{r.sku}</div>
                      <div className="text-xs text-muted line-clamp-1">{r.title}</div>
                    </div>
                  </TD>
                  <TD className="text-right">{ars(r.gross)}</TD>
                  <TD className="text-right">{ars(-Math.abs(r.fees))}</TD>
                  <TD className="text-right">{ars(-Math.abs(r.shipping))}</TD>
                  <TD className="text-right">{ars(-Math.abs(r.ads))}</TD>
                  <TD className="text-right">{ars(-Math.abs(r.refunds))}</TD>
                  <TD className="text-right font-semibold">{ars(r.net)}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
          <div className="mt-3 text-xs text-muted">
            Mostrando {Math.min(40, filtered.length)} de {compact(filtered.length)} (demo).
          </div>
        </CardBody>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={`Movimientos · ${selected ?? ""}`}>
        <div className="space-y-3">
          <div className="text-sm text-muted">Detalle de movimientos vinculados a la operación. En producción: se construye desde MP/ML liquidaciones + ajustes.</div>

          <Table>
            <THead>
              <TR>
                <TH>Tipo</TH>
                <TH>Nota</TH>
                <TH className="text-right">Importe</TH>
              </TR>
            </THead>
            <tbody>
              {selectedMoves.map((m) => (
                <TR key={m.id}>
                  <TD>
                    <Badge tone={m.kind === "Ajuste" ? "warn" : m.kind === "Devolución" ? "bad" : "neutral"}>{m.kind}</Badge>
                  </TD>
                  <TD className="text-sm text-muted">{m.note ?? "—"}</TD>
                  <TD className="text-right font-medium">{ars(m.amount)}</TD>
                </TR>
              ))}
              {selectedMoves.length === 0 ? (
                <TR>
                  <TD colSpan={3} className="text-sm text-muted">
                    Sin movimientos para mostrar.
                  </TD>
                </TR>
              ) : null}
            </tbody>
          </Table>

          <div className="flex items-center justify-between rounded-2xl border border-border bg-panel2/40 px-3 py-2">
            <div className="text-sm text-muted">Neto calculado por movimientos (demo)</div>
            <div className="text-sm font-semibold">{ars(computedNet)}</div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
