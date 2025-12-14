"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";

import { ars, compact, dateEs } from "@/lib/format";
import { stockPurchasesMock, stockSkuMasterMock } from "@/lib/mock";
import { buildUnitCostMap, unitCostForSku, type CostMode } from "@/lib/margen";

const MODES = [
  { label: "Costo promedio ponderado (WAC)", value: "wac" },
  { label: "Último costo", value: "last" },
] as const;

export default function MargenCogsPage() {
  const [mode, setMode] = useState<CostMode>("wac");

  const master = useMemo(() => stockSkuMasterMock(), []);
  const purchases = useMemo(() => stockPurchasesMock(), []);
  const costMap = useMemo(() => buildUnitCostMap(), []);

  const rows = useMemo(() => {
    return master.map((m) => {
      const info = unitCostForSku(costMap, m.sku, mode);
      const raw = costMap.get(m.sku);
      return {
        ...m,
        unitCost: info.unitCost,
        source: info.source,
        wac: raw?.wac,
        last: raw?.last,
        fallback: raw?.fallback,
      };
    });
  }, [master, costMap, mode]);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Stock / Costos (COGS)"
          subtitle="Maestro de SKUs con costo unitario. Sin COGS, no existe margen real. En el MVP usamos WAC o último costo (configurable)."
        />
        <CardBody>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <Select value={mode} onChange={(e) => setMode(e.target.value as CostMode)}>
                {MODES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
              <Badge tone="neutral">SKUs: {rows.length}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary">Cargar compra</Button>
              <Button variant="primary">Editar costos</Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Maestro de costos" subtitle="Fuente de costo: WAC / último / fallback. En producción: reglas por lote y auditoría de cambios." />
        <CardBody>
          <Table>
            <THead>
              <TR>
                <TH>SKU</TH>
                <TH>Producto</TH>
                <TH>Categoría</TH>
                <TH className="text-right">WAC</TH>
                <TH className="text-right">Último</TH>
                <TH className="text-right">Fallback</TH>
                <TH className="text-right">Costo usado</TH>
                <TH>Fuente</TH>
              </TR>
            </THead>
            <tbody>
              {rows.map((r) => (
                <TR key={r.sku}>
                  <TD className="font-medium">{r.sku}</TD>
                  <TD>
                    <div className="leading-tight">
                      <div className="font-medium">{r.model}</div>
                      <div className="text-xs text-muted">Lead time: {r.leadTimeDays} días · Target: {r.targetStock}</div>
                    </div>
                  </TD>
                  <TD>{r.category}</TD>
                  <TD className="text-right">{typeof r.wac === "number" ? ars(r.wac) : "—"}</TD>
                  <TD className="text-right">{typeof r.last === "number" ? ars(r.last) : "—"}</TD>
                  <TD className="text-right">{typeof r.fallback === "number" ? ars(r.fallback) : "—"}</TD>
                  <TD className="text-right font-semibold">{r.unitCost ? ars(r.unitCost) : "—"}</TD>
                  <TD>
                    <Badge tone={r.source === "missing" ? "bad" : r.source === "fallback" ? "warn" : "neutral"}>{r.source}</Badge>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>

          <div className="mt-3 text-xs text-muted">Modo: {mode.toUpperCase()} · Los costos se usan luego en Métricas para calcular margen por venta.</div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Compras (demo)" subtitle="Base para calcular WAC. En producción: importación desde compras + conciliación de stock." />
        <CardBody>
          <Table>
            <THead>
              <TR>
                <TH>Compra</TH>
                <TH>Fecha</TH>
                <TH>SKU</TH>
                <TH>Proveedor</TH>
                <TH className="text-right">Cant.</TH>
                <TH className="text-right">Total</TH>
                <TH className="text-right">Unit.</TH>
              </TR>
            </THead>
            <tbody>
              {purchases.slice(0, 12).map((p) => (
                <TR key={p.id}>
                  <TD className="font-medium">{p.id}</TD>
                  <TD>{dateEs(new Date(p.date + "T00:00:00Z"))}</TD>
                  <TD>{p.sku}</TD>
                  <TD className="text-sm text-muted">{p.supplier}</TD>
                  <TD className="text-right">{p.qty}</TD>
                  <TD className="text-right">{ars(p.totalCost)}</TD>
                  <TD className="text-right">{ars(p.totalCost / p.qty)}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
          <div className="mt-3 text-xs text-muted">Mostrando {Math.min(12, purchases.length)} de {compact(purchases.length)} compras (demo).</div>
        </CardBody>
      </Card>
    </div>
  );
}
