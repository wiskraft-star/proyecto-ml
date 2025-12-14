"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";

import { ars, compact, dateEs } from "@/lib/format";
import { salesMock, type SaleRow } from "@/lib/mock";

const STATUS = [
  { label: "Todos", value: "all" },
  { label: "Entregado", value: "Entregado" },
  { label: "En camino", value: "En camino" },
  { label: "Cancelado", value: "Cancelado" },
  { label: "Devuelto", value: "Devuelto" },
] as const;

export default function MargenVentasPage() {
  const all = useMemo(() => salesMock(), []);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<(typeof STATUS)[number]["value"]>("all");

  const rows = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return all.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!qq) return true;
      return r.orderId.toLowerCase().includes(qq) || r.sku.toLowerCase().includes(qq) || r.title.toLowerCase().includes(qq);
    });
  }, [all, q, status]);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Ventas"
          subtitle="Entrada principal: la venta existe. Acá solo identificamos orden/pack + ítems (SKU/cant) y contexto (estado)."
        />
        <CardBody>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por order/pack, SKU, título…" className="md:w-[360px]" />
              <Select
                value={status}
                onChange={(v) => setStatus(v as any)}
                options={STATUS.map((s) => ({ label: s.label, value: s.value }))}
              />
              <Badge tone="neutral">Filas: {rows.length}</Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary">Importar órdenes</Button>
              <Button variant="primary">Nuevo filtro</Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Lista de órdenes / packs" subtitle="En el MVP vamos a usar ORDER_ID o PACK_ID como llave. Luego se une con Cobros/Liquidaciones." />
        <CardBody>
          <Table>
            <THead>
              <TR>
                <TH>Orden/Pack</TH>
                <TH>Fecha</TH>
                <TH>SKU</TH>
                <TH className="text-right">Cant.</TH>
                <TH className="text-right">Ticket (bruto)</TH>
                <TH>Estado</TH>
              </TR>
            </THead>

            <tbody>
              {rows.slice(0, 40).map((r: SaleRow) => (
                <TR key={r.orderId + r.date + r.sku}>
                  <TD className="font-medium">{r.orderId}</TD>
                  <TD>{dateEs(new Date(r.date + "T00:00:00Z"))}</TD>
                  <TD>
                    <div className="leading-tight">
                      <div className="font-medium">{r.sku}</div>
                      <div className="text-xs text-muted line-clamp-1">{r.title}</div>
                    </div>
                  </TD>
                  <TD className="text-right">{r.qty}</TD>
                  <TD className="text-right">{ars(r.gross)}</TD>
                  <TD>
                    <Badge tone={r.status === "Devuelto" ? "bad" : r.status === "Cancelado" ? "warn" : "neutral"}>{r.status}</Badge>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>

          <div className="mt-3 text-xs text-muted">
            Mostrando {Math.min(40, rows.length)} de {compact(rows.length)} (demo). En producción: paginado y búsqueda server-side.
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
