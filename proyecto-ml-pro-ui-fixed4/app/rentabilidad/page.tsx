"use client";

import { useMemo, useState } from "react";
import { pnlMock, expensesMock } from "@/lib/mock";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ars } from "@/lib/format";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

export default function RentabilidadPage() {
  const pnl = useMemo(() => pnlMock(), []);
  const extra = useMemo(() => expensesMock(), []);
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Rentabilidad"
          subtitle="Estado de resultados (P&L) con auditoría por capas. Modo demo."
          right={<Badge tone="good">Número sagrado</Badge>}
        />
        <CardBody>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-panel2/30 p-4">
              <div className="text-sm font-semibold">Estado de resultados</div>
              <div className="mt-3 space-y-2 text-sm">
                {pnl.map((l) => (
                  <div key={l.label} className="flex items-center justify-between">
                    <div className={l.kind === "total" ? "font-semibold" : "text-muted"}>{l.label}</div>
                    <div className={l.kind === "total" ? "text-lg font-semibold" : "font-medium"}>
                      {ars(l.amount)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="secondary" onClick={() => setOpen(true)}>Ver auditoría</Button>
                <Button variant="primary" onClick={() => alert("Fase 2: export del P&L / envío a contador.")}>Exportar</Button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-panel2/30 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Fugas de margen (top)</div>
                <Badge tone="warn">Accionable</Badge>
              </div>
              <div className="mt-3 space-y-3">
                <Leak title="Publicidad" text="ACOS alto en campañas específicas. Ajustar segmentación/pujas protege margen." />
                <Leak title="Envíos" text="Costo neto subió por mix de productos pesados. Revisar estrategia de envío." />
                <Leak title="Devoluciones" text="Aumentó el envío negativo. Identificar SKUs con reclamos repetidos." />
                <Leak title="Costos internos" text="MO y embalaje por unidad afectan productos de ticket bajo." />
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Notas operativas" subtitle="Cómo se mantiene la exactitud sin volver la UI engorrosa." />
        <CardBody className="grid gap-4 md:grid-cols-3">
          <Note title="Capa 1" text="Neto y margen arriba (lo esencial)." badge="Resumen" tone="good" />
          <Note title="Capa 2" text="Desglose por bloques (por qué pasa)." badge="Diagnóstico" tone="neutral" />
          <Note title="Capa 3" text="Auditoría: movimientos y reglas." badge="Trazabilidad" tone="warn" />
        </CardBody>
      </Card>

      <Drawer open={open} onClose={() => setOpen(false)} title="Auditoría (demo)" width="max-w-2xl">
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-panel2/30 p-4 text-sm text-muted">
            En producción, esta pantalla se alimenta de: movimientos ML/MP + mapping + reglas de clasificación + costos internos + impuestos modo real/estimado.
          </div>

          <div className="rounded-2xl border border-border bg-panel2/30 p-4">
            <div className="text-sm font-semibold">Ejemplo de gastos internos del mes</div>
            <div className="mt-3 space-y-2 text-sm">
              {extra.map((e) => (
                <div key={e.name} className="flex items-center justify-between">
                  <div className="text-muted">{e.name}</div>
                  <div className="font-medium">{ars(e.amount)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-panel2/30 p-4 text-sm text-muted">
            “Envio negativo”: cuando en movimientos aparece importe negativo asociado a devolución, se clasifica en DEVOLUCIONES &gt; Envío devolución (costo).
          </div>
        </div>
      </Drawer>
    </div>
  );
}

function Leak({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-bg/30 p-4">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-sm text-muted">{text}</div>
    </div>
  );
}

function Note({ title, text, badge, tone }: { title: string; text: string; badge: string; tone: "good"|"warn"|"bad"|"neutral" }) {
  return (
    <div className="rounded-2xl border border-border bg-panel2/30 p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{title}</div>
        <Badge tone={tone}>{badge}</Badge>
      </div>
      <div className="mt-2 text-sm text-muted">{text}</div>
    </div>
  );
}
