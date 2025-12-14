"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";

import { ars, compact, dateEs } from "@/lib/format";
import { suppliesMock, type SupplyItem } from "@/lib/mock";

function recipeCost(items: SupplyItem[]) {
  return items.reduce((acc, i) => acc + i.costUnit * i.perPack, 0);
}

export default function MargenInsumosPage() {
  const data = useMemo(() => suppliesMock(), []);
  const costPerPack = useMemo(() => recipeCost(data.items), [data.items]);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Insumos"
          subtitle="Costos operativos variables (empaque, etiquetado, seguridad…). En el MVP definimos reglas simples por paquete / por venta."
        />
        <CardBody>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral">Items: {data.items.length}</Badge>
              <Badge tone="good">Costo receta estándar: {ars(costPerPack)}</Badge>
              <Badge tone="warn">Nota: la receta se aplica a envíos físicos (digital = 0)</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary">Cargar compra</Button>
              <Button variant="primary">Editar receta</Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Maestro de insumos" subtitle="Stock y costo unitario base + consumo por paquete (receta estándar)." />
        <CardBody>
          <Table>
            <THead>
              <TR>
                <TH>Insumo</TH>
                <TH>Categoría</TH>
                <TH>Unidad</TH>
                <TH className="text-right">Costo unit.</TH>
                <TH className="text-right">Stock</TH>
                <TH className="text-right">Consumo/pack</TH>
                <TH className="text-right">Costo/pack</TH>
                <TH className="text-right">Mín / Objetivo</TH>
              </TR>
            </THead>
            <tbody>
              {data.items.map((i) => {
                const perPackCost = i.costUnit * i.perPack;
                const low = i.stock < i.min;
                return (
                  <TR key={i.id}>
                    <TD className="font-medium">
                      <div className="leading-tight">
                        <div>{i.name}</div>
                        <div className="text-xs text-muted">Proveedor: {i.supplier ?? "—"} · Lead: {i.leadTimeDays}d</div>
                      </div>
                    </TD>
                    <TD>{i.category}</TD>
                    <TD className="text-sm text-muted">{i.unitBase}</TD>
                    <TD className="text-right">{ars(i.costUnit)}</TD>
                    <TD className="text-right">
                      <Badge tone={low ? "bad" : "neutral"}>{compact(i.stock)}</Badge>
                    </TD>
                    <TD className="text-right">{i.perPack}</TD>
                    <TD className="text-right font-semibold">{ars(perPackCost)}</TD>
                    <TD className="text-right text-sm text-muted">
                      {compact(i.min)} / {compact(i.target)}
                    </TD>
                  </TR>
                );
              })}
            </tbody>
          </Table>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Compras de insumos (demo)" subtitle="Al cargar compras, recalculamos costo unitario promedio y controlamos stock." />
        <CardBody>
          <Table>
            <THead>
              <TR>
                <TH>Compra</TH>
                <TH>Fecha</TH>
                <TH>Proveedor</TH>
                <TH>Item</TH>
                <TH className="text-right">Cantidad</TH>
                <TH className="text-right">Total</TH>
              </TR>
            </THead>
            <tbody>
              {data.purchases.slice(0, 12).map((p) => (
                <TR key={p.id}>
                  <TD className="font-medium">{p.id}</TD>
                  <TD>{dateEs(new Date(p.date + "T00:00:00Z"))}</TD>
                  <TD className="text-sm text-muted">{p.supplier}</TD>
                  <TD>{p.itemId}</TD>
                  <TD className="text-right">{compact(p.qty)}</TD>
                  <TD className="text-right">{ars(p.total)}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
