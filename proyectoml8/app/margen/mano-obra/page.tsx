"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";

import { ars } from "@/lib/format";
import { DEFAULT_OPS_RULE } from "@/lib/margen";

type RuleRow = {
  id: string;
  scope: "Envío físico" | "Digital" | "Excepción";
  when: string;
  cost: number;
  note: string;
};

export default function MargenManoObraPage() {
  const [laborFisico, setLaborFisico] = useState(DEFAULT_OPS_RULE.laborPerShipment);
  const [laborDigital, setLaborDigital] = useState(DEFAULT_OPS_RULE.digitalLabor);

  const rules: RuleRow[] = useMemo(
    () => [
      {
        id: "r1",
        scope: "Envío físico",
        when: "Si el SKU NO es digital (celular/accesorio) y la venta requiere preparación",
        cost: laborFisico,
        note: "Packing / despacho (demo)",
      },
      {
        id: "r2",
        scope: "Digital",
        when: "Si el SKU es digital (código / giftcard)",
        cost: laborDigital,
        note: "Entrega automática / operación mínima",
      },
      {
        id: "r3",
        scope: "Excepción",
        when: "Reproceso por reclamo (si aplica)",
        cost: 0,
        note: "Se modela aparte (postventa) en el futuro",
      },
    ],
    [laborFisico, laborDigital]
  );

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Mano de obra"
          subtitle="Costo de preparación por venta o por ítem. En el MVP lo modelamos como reglas parametrizables (físico vs digital)."
        />
        <CardBody>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-panel2/40 p-3">
              <div className="text-xs font-semibold">MO envío físico</div>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  type="number"
                  value={laborFisico}
                  onChange={(e) => setLaborFisico(Math.max(0, Number(e.target.value) || 0))}
                />
                <Badge tone="neutral">{ars(laborFisico)}</Badge>
              </div>
              <div className="mt-2 text-xs text-muted">Ej: preparación por paquete (mamá) — valor fijo por envío.</div>
            </div>

            <div className="rounded-2xl border border-border bg-panel2/40 p-3">
              <div className="text-xs font-semibold">MO digital</div>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  type="number"
                  value={laborDigital}
                  onChange={(e) => setLaborDigital(Math.max(0, Number(e.target.value) || 0))}
                />
                <Badge tone="neutral">{ars(laborDigital)}</Badge>
              </div>
              <div className="mt-2 text-xs text-muted">Por defecto 0 (entrega automática / operación mínima).</div>
            </div>

            <div className="flex flex-col justify-between gap-2 rounded-2xl border border-border bg-panel2/40 p-3">
              <div>
                <div className="text-xs font-semibold">Acciones</div>
                <div className="mt-2 text-xs text-muted">En producción: reglas por SKU, por tipo de envío, por centro de despacho.</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary">Guardar</Button>
                <Button variant="primary">Agregar excepción</Button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Reglas (MVP)" subtitle="Estas reglas alimentan el cálculo de margen neto en Métricas." />
        <CardBody>
          <Table>
            <THead>
              <TR>
                <TH>Alcance</TH>
                <TH>Condición</TH>
                <TH className="text-right">Costo</TH>
                <TH>Nota</TH>
              </TR>
            </THead>
            <tbody>
              {rules.map((r) => (
                <TR key={r.id}>
                  <TD className="font-medium">{r.scope}</TD>
                  <TD className="text-sm text-muted">{r.when}</TD>
                  <TD className="text-right font-semibold">{ars(r.cost)}</TD>
                  <TD className="text-sm text-muted">{r.note}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
