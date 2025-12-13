"use client";

import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { useState } from "react";

type Claim = {
  id: string;
  orderId: string;
  type: "Reclamo" | "Devolución";
  status: "Abierto" | "En gestión" | "Cerrado";
  reason: string;
  cost: number;
  impact: "Alto" | "Medio" | "Bajo";
};

const demo: Claim[] = [
  { id: "CLM-001", orderId: "2000010171546565", type: "Devolución", status: "Abierto", reason: "Equipo devuelto (envío negativo)", cost: 28400, impact: "Alto" },
  { id: "CLM-002", orderId: "2000010200016693", type: "Reclamo", status: "En gestión", reason: "Problema con rendimiento", cost: 0, impact: "Medio" },
  { id: "CLM-003", orderId: "2000010135617651", type: "Reclamo", status: "Cerrado", reason: "Consulta resuelta", cost: 0, impact: "Bajo" },
];

export default function PostventaPage() {
  const [picked, setPicked] = useState<Claim | null>(null);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Postventa" subtitle="Reclamos y devoluciones con impacto reputación y costo real (modo demo)." right={<Badge tone="warn">Prioridad</Badge>} />
        <CardBody>
          <div className="grid gap-4 md:grid-cols-3">
            <Metric label="Abiertos" value="2" tone="bad" />
            <Metric label="En gestión" value="1" tone="warn" />
            <Metric label="Costo devoluciones" value="ARS 28.400" tone="bad" />
          </div>

          <div className="mt-4">
            <Table>
              <THead>
                <TR className="border-t-0">
                  <TH>ID</TH>
                  <TH>Orden</TH>
                  <TH>Tipo</TH>
                  <TH>Estado</TH>
                  <TH>Impacto</TH>
                  <TH className="text-right">Costo</TH>
                  <TH></TH>
                </TR>
              </THead>
              <tbody>
                {demo.map((c) => (
                  <TR key={c.id} className="hover:bg-panel2/40">
                    <TD className="font-medium">{c.id}</TD>
                    <TD className="text-muted">{c.orderId}</TD>
                    <TD><Badge tone={c.type === "Devolución" ? "bad" : "warn"}>{c.type}</Badge></TD>
                    <TD><Badge tone={c.status === "Cerrado" ? "good" : c.status === "En gestión" ? "warn" : "bad"}>{c.status}</Badge></TD>
                    <TD><Badge tone={c.impact === "Alto" ? "bad" : c.impact === "Medio" ? "warn" : "neutral"}>{c.impact}</Badge></TD>
                    <TD className="text-right">{c.cost ? `ARS ${c.cost.toLocaleString("es-AR")}` : "—"}</TD>
                    <TD className="text-right"><Button size="sm" onClick={() => setPicked(c)}>Detalle</Button></TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </div>
        </CardBody>
      </Card>

      <Drawer open={!!picked} onClose={() => setPicked(null)} title={picked ? `${picked.id} — ${picked.type}` : ""} width="max-w-2xl">
        {picked ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-panel2/30 p-4">
              <div className="text-sm font-semibold">Resumen</div>
              <div className="mt-2 text-sm text-muted">{picked.reason}</div>
            </div>

            <div className="rounded-2xl border border-border bg-panel2/30 p-4">
              <div className="text-sm font-semibold">Impacto y acción sugerida</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
                <li>Resolver hoy para proteger reputación.</li>
                <li>Si es devolución: registrar costo “envío negativo” y motivo.</li>
                <li>Si es reclamo: responder con plantilla y documentar evidencia.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-panel2/30 p-4 text-sm text-muted">
              En producción se integra: claims API, mensajes, estados ML, métricas reputación y automatizaciones.
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "good"|"warn"|"bad"|"neutral" }) {
  return (
    <div className="rounded-2xl border border-border bg-panel2/30 p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      <div className="mt-2"><Badge tone={tone}>{tone.toUpperCase()}</Badge></div>
    </div>
  );
}
