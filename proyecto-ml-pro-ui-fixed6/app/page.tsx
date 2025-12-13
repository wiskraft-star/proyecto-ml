"use client";

import { useMemo, useState } from "react";
import { dashboardMock } from "@/lib/mock";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ActionsPanel } from "@/components/dashboard/actions";
import { ExpenseBars } from "@/components/dashboard/charts";
import { Drawer } from "@/components/ui/drawer";
import { ars, pct } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { kpis, actions, expenseBlocks } = useMemo(() => dashboardMock(), []);
  const [drawer, setDrawer] = useState<{ title: string; body: React.ReactNode } | null>(null);
  const [period, setPeriod] = useState<"hoy" | "7d" | "15d" | "30d" | "mes" | "rango">("mes");
  const [from, setFrom] = useState("2025-12-01");
  const [to, setTo] = useState("2025-12-13");

  function periodLabel() {
    if (period === "hoy") return "Hoy";
    if (period === "7d") return "Últimos 7";
    if (period === "15d") return "Últimos 15";
    if (period === "30d") return "Últimos 30";
    if (period === "mes") return "Mes actual";
    return `Rango ${from} → ${to}`;
  }

  function openKpi(k: typeof kpis[number]) {
    setDrawer({
      title: `${k.label} — de dónde sale`,
      body: (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-panel2/30 p-4">
            <div className="text-xs text-muted">Valor</div>
            <div className="mt-1 text-2xl font-semibold">
              {k.key === "margin" ? pct(k.value) : k.key === "risk" || k.key === "orders" || k.key === "rep" ? String(k.value) : ars(k.value)}
            </div>
            {k.hint ? <div className="mt-2 text-sm text-muted">{k.hint}</div> : null}
          </div>

          <div className="rounded-2xl border border-border bg-panel2/30 p-4">
            <div className="text-sm font-semibold">Trazabilidad</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
              <li>Se calcula desde movimientos ML/MP clasificados por reglas.</li>
              <li>Los costos internos se imputan por unidad (embalaje, MO) y por mes (fijos).</li>
              <li>En devoluciones, se detecta “envío negativo” como costo.</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => alert("En la fase 2, esto abrirá la auditoría real (movimientos).")}>Ver movimientos</Button>
            <Button variant="primary" onClick={() => alert("En la fase 2, esto abrirá el reporte en detalle.")}>Abrir reporte</Button>
          </div>
        </div>
      ),
    });
  }

  function openAction(id: string) {
    const a = actions.find((x) => x.id === id);
    if (!a) return;
    setDrawer({
      title: `Acción — ${a.title}`,
      body: (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge tone={a.tone === "neutral" ? "neutral" : a.tone}>{a.tone === "neutral" ? "Info" : a.tone.toUpperCase()}</Badge>
            <div className="text-sm font-semibold">{a.cta}</div>
          </div>
          <div className="rounded-2xl border border-border bg-panel2/30 p-4 text-sm text-muted">{a.detail}</div>
          <div className="rounded-2xl border border-border bg-panel2/30 p-4">
            <div className="text-sm font-semibold">Siguiente paso recomendado</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
              <li>Revisar el detalle (items afectados) y confirmar si el costo/margen está bien imputado.</li>
              <li>Aplicar una acción: reposición, ajuste de precio, pausa de ads o gestión postventa.</li>
              <li>Registrar decisión para trazabilidad (fase 3).</li>
            </ul>
          </div>
        </div>
      ),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-sm text-muted">Cabina de mando</div>
          <div className="mt-1 text-2xl font-semibold">Negocio en un vistazo</div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Badge tone="good">Conectable</Badge>
          <Badge tone="warn">Datos: demo</Badge>
          <div className="ml-2 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-panel px-2 py-1.5">
            <span className="hidden md:inline text-xs text-muted">Período</span>
            <Button size="sm" variant={period==="hoy" ? "primary" : "secondary"} onClick={() => setPeriod("hoy")}>Hoy</Button>
            <Button size="sm" variant={period==="7d" ? "primary" : "secondary"} onClick={() => setPeriod("7d")}>7d</Button>
            <Button size="sm" variant={period==="15d" ? "primary" : "secondary"} onClick={() => setPeriod("15d")}>15d</Button>
            <Button size="sm" variant={period==="30d" ? "primary" : "secondary"} onClick={() => setPeriod("30d")}>30d</Button>
            <Button size="sm" variant={period==="mes" ? "primary" : "secondary"} onClick={() => setPeriod("mes")}>Mes</Button>
            <Button size="sm" variant={period==="rango" ? "primary" : "secondary"} onClick={() => setPeriod("rango")}>Rango</Button>
            {period==="rango" ? (
              <div className="flex items-center gap-2 pl-1">
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl border border-border bg-bg px-2 py-1 text-xs text-text outline-none focus:border-accent/60" />
                <span className="text-xs text-muted">a</span>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl border border-border bg-bg px-2 py-1 text-xs text-text outline-none focus:border-accent/60" />
              </div>
            ) : null}
          </div>
          <Badge tone="neutral">{periodLabel()}</Badge>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {kpis.filter((k) => ["gmv","orders","net","margin"].includes(k.key)).map((k) => (
          <KpiCard
            key={k.key}
            label={k.label}
            value={k.value}
            deltaPct={k.deltaPct}
            tone={k.tone}
            format={k.key === "margin" ? "pct" : k.key === "risk" || k.key === "orders" || k.key === "rep" ? "raw" : "ars"}
            hint={k.hint}
            onClick={() => openKpi(k)}
          />
        ))}
      </div>

      {/* Actions + charts */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-1">
          <ActionsPanel items={actions} onPick={openAction} />
        </div>
        <div className="xl:col-span-2 space-y-6">
          <ExpenseBars blocks={expenseBlocks} />

          <Card>
            <CardHeader title="Reputación & reclamos (Mercado Libre)" subtitle="Salud de la cuenta (modo demo)" right={<Badge tone="neutral">ML</Badge>} />
            <CardBody className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-panel2/30 p-4">
                <div className="text-xs text-muted">Nivel</div>
                <div className="mt-1 text-lg font-semibold">MercadoLíder (referencia)</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone="good">Estado: Verde</Badge>
                  <Badge tone="warn">Últimos 60 días</Badge>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-panel2/30 p-4">
                <div className="text-xs text-muted">Métricas clave</div>
                <div className="mt-2 space-y-2 text-sm">
                  <div className="flex items-center justify-between"><span className="text-muted">Ventas</span><span className="font-semibold">1.254</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted">Con envíos</span><span className="font-semibold">1.041</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted">Facturado</span><span className="font-semibold">{ars(128_450_000)}</span></div>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-panel2/30 p-4">
                <div className="text-xs text-muted">Riesgos</div>
                <div className="mt-2 space-y-2 text-sm">
                  <div className="flex items-center justify-between"><span className="text-muted">Reclamos</span><span className="font-semibold">18</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted">Mediaciones</span><span className="font-semibold">2</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted">Canceladas por vos</span><span className="font-semibold">3</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted">Despachos con demora</span><span className="font-semibold">7</span></div>
                </div>
                <div className="mt-3 text-xs text-muted">Etapa 2: conectar API ML para leerlo automático.</div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Quick insights */}
      <Card>
        <CardHeader title="Insights rápidos" subtitle="Lectura automática del período (modo demo)." right={<Badge tone="neutral">Resumen</Badge>} />
        <CardBody className="grid gap-4 md:grid-cols-3">
          <Insight title="Margen bajo por devoluciones" text="La tasa y el costo de devoluciones aumentaron; priorizá SKUs con reclamos recurrentes y revisá descripción/QA." tone="warn" />
          <Insight title="Ads empujando ventas" text="Publicidad subió 14% y sostiene volumen. Ajustar campañas con ACOS alto protege margen sin frenar ventas." tone="neutral" />
          <Insight title="Stock crítico" text="12 SKUs con cobertura < 7 días. Reponer primero los de mayor contribución a ganancia neta." tone="bad" />
        </CardBody>
      </Card>

      <Drawer open={!!drawer} onClose={() => setDrawer(null)} title={drawer?.title ?? ""} width="max-w-2xl">
        {drawer?.body}
      </Drawer>
    </div>
  );
}

function Insight({ title, text, tone }: { title: string; text: string; tone: "neutral"|"warn"|"bad"|"good" }) {
  return (
    <div className="rounded-2xl border border-border bg-panel2/30 p-4">
      <div className="flex items-center gap-2">
        <Badge tone={tone}>{title}</Badge>
      </div>
      <div className="mt-2 text-sm text-muted">{text}</div>
    </div>
  );
}
