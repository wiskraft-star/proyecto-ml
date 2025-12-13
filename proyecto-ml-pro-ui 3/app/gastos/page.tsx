"use client";

import { useMemo, useState } from "react";
import { expensesMock } from "@/lib/mock";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ars } from "@/lib/format";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

export default function GastosPage() {
  const blocks = useMemo(() => expensesMock(), []);
  const [open, setOpen] = useState(false);

  const total = blocks.reduce((a, b) => a + b.amount, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Gastos"
          subtitle="Bloques de gastos (internos + administración). Modo demo."
          right={<Badge tone="neutral">Total: {ars(total)}</Badge>}
        />
        <CardBody className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {blocks.map((b) => (
            <div key={b.name} className="rounded-2xl border border-border bg-panel2/30 p-4">
              <div className="text-sm font-semibold">{b.name}</div>
              <div className="mt-2 text-2xl font-semibold">{ars(b.amount)}</div>
              <div className="mt-2 text-sm text-muted">{b.note}</div>
              <div className="mt-3">
                <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>Ver detalle</Button>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Clasificación automática" subtitle="Reglas para mapear movimientos ML/MP a bloques (clave para exactitud)." />
        <CardBody className="grid gap-4 md:grid-cols-3">
          <Rule title="Movimiento → bloque" text="Se usa un catálogo de tipos de movimiento para clasificar cargos/bonificaciones." />
          <Rule title="Devoluciones" text="Si aparece envío negativo asociado a devolución, se imputa como costo de devoluciones." />
          <Rule title="Impuestos" text="Modo real (cargado) o estimado. Se decide en Parámetros para mantener consistencia." />
        </CardBody>
      </Card>

      <Drawer open={open} onClose={() => setOpen(false)} title="Detalle (demo)" width="max-w-2xl">
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-panel2/30 p-4 text-sm text-muted">
            En producción, este detalle es una tabla con registros: fecha, proveedor, categoría, monto, nota, adjunto y fuente (manual/import/ML/MP).
          </div>
          <div className="rounded-2xl border border-border bg-panel2/30 p-4">
            <div className="text-sm font-semibold">Ejemplos de registros</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
              <li>Emb. — compra de burbuja (lote) — ARS 120.000</li>
              <li>MO — armado semanal — ARS 400.000</li>
              <li>Factura ML — ciclo 14–14 — ARS 2.000.000</li>
            </ul>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

function Rule({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-panel2/30 p-4">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-2 text-sm text-muted">{text}</div>
    </div>
  );
}
