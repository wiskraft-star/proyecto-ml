"use client";

import { useMemo, useState } from "react";
import { stockMock, type StockRow } from "@/lib/mock";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { ars } from "@/lib/format";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

export default function StockPage() {
  const rows = useMemo(() => stockMock(), []);
  const [picked, setPicked] = useState<StockRow | null>(null);

  const stockValue = rows.reduce((a, r) => a + r.value, 0);
  const critical = rows.filter((r) => r.daysCover < 7).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs text-muted">Valor de stock</div>
          <div className="mt-2 text-2xl font-semibold">{ars(stockValue)}</div>
          <div className="mt-2 text-sm text-muted">Capital inmovilizado (aprox.).</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted">SKUs críticos</div>
          <div className="mt-2 text-2xl font-semibold">{critical}</div>
          <div className="mt-2 text-sm text-muted">Cobertura &lt; 7 días.</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted">Acción sugerida</div>
          <div className="mt-2 text-sm font-semibold">Reponer por contribución</div>
          <div className="mt-2 text-sm text-muted">Primero SKUs con mayor ganancia total.</div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Stock operativo" subtitle="Vista central (cobertura, rotación y valor). Click para detalle." right={<Badge tone={critical ? "warn" : "good"}>{critical ? "Atención" : "OK"}</Badge>} />
        <CardBody>
          <Table>
            <THead>
              <TR className="border-t-0">
                <TH>SKU</TH>
                <TH>Producto</TH>
                <TH className="text-right">En mano</TH>
                <TH className="text-right">Disponible</TH>
                <TH className="text-right">Comprom.</TH>
                <TH className="text-right">Cobertura</TH>
                <TH>Rotación</TH>
                <TH className="text-right">Valor</TH>
                  <TH className="text-right">Detalle</TH>
              </TR>
            </THead>
            <tbody>
              {rows.map((r) => (
                <TR key={r.sku} className="hover:bg-panel2/40">
                  <TD className="font-medium">{r.sku}</TD>
                  <TD>
                    <div className="font-medium">{r.title}</div>
                    <div className="text-xs text-muted">Cobertura: {r.daysCover} días</div>
                  </TD>
                  <TD className="text-right">{r.onHand}</TD>
                  <TD className="text-right">{r.available}</TD>
                  <TD className="text-right">{r.committed}</TD>
                  <TD className="text-right">
                    <Badge tone={r.daysCover < 7 ? "bad" : r.daysCover < 14 ? "warn" : "good"}>{r.daysCover}d</Badge>
                  </TD>
                  <TD>
                    <Badge tone={r.velocity === "Alta" ? "good" : r.velocity === "Media" ? "warn" : "neutral"}>{r.velocity}</Badge>
                  </TD>
                  <TD className="text-right">{ars(r.value)}</TD>
                  <TD className="text-right">
                    <Button variant="secondary" size="sm" onClick={() => setPicked(r)}>Detalle</Button>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </CardBody>
      </Card>

      <Drawer open={!!picked} onClose={() => setPicked(null)} title={picked ? `SKU ${picked.sku}` : ""} width="max-w-2xl">
        {picked ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-panel2/30 p-4">
              <div className="text-sm font-semibold">{picked.title}</div>
              <div className="mt-1 text-sm text-muted">Rotación: {picked.velocity} · Cobertura: {picked.daysCover} días</div>
            </div>

            <div className="rounded-2xl border border-border bg-panel2/30 p-4">
              <div className="text-sm font-semibold">Recomendación</div>
              <div className="mt-2 text-sm text-muted">
                {picked.daysCover < 7
                  ? "Reponer ya. Priorizar proveedor/lead time y asegurar stock de seguridad."
                  : picked.daysCover < 14
                  ? "Planificar reposición. Ajustar compras para no inmovilizar capital."
                  : "Stock sano. Monitorear rotación y mantener safety stock."}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-panel2/30 p-4 text-sm text-muted">
              En producción, acá aparece: movimientos, compras, ventas por día, lead time, y sugerencia cuantitativa de compra.
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
