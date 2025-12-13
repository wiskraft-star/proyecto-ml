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
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function DashboardPage() {
  const { kpis: baseKpis, actions, series, expenseBlocks } = useMemo(() => dashboardMock(), []);
  const [drawer, setDrawer] = useState<{ title: string; body: React.ReactNode } | null>(null);

  // Período (UI-only, mock)
  const [preset, setPreset] = useState<"hoy"|"7d"|"15d"|"30d"|"mes"|"rango">("mes");
  const [from, setFrom] = useState("2025-12-01");
  const [to, setTo] = useState("2025-12-13");

  const days = useMemo(() => {
    if (preset === "hoy") return 1;
    if (preset === "7d") return 7;
    if (preset === "15d") return 15;
    if (preset === "30d") return 30;
    if (preset === "mes") return 30;
    // rango
    const a = new Date(from + "T00:00:00");
    const b = new Date(to + "T00:00:00");
    const diff = Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000) + 1);
    return Math.min(60, diff || 1);
  }, [preset, from, to]);

  const periodLabel = useMemo(() => {
    if (preset === "hoy") return "Hoy";
    if (preset === "7d") return "Últimos 7 días";
    if (preset === "15d") return "Últimos 15 días";
    if (preset === "30d") return "Últimos 30 días";
    if (preset === "mes") return "Mes actual";
    return `${from} → ${to}`;
  }, [preset, from, to]);

  const kpis = useMemo(() => {
    const mult = preset === "mes" ? 1 : Math.max(0.05, Math.min(1, days / 30));
    return baseKpis.map((k) => {
      if (["gmv","net","orders","ads","returns"].includes(k.key)) {
        return { ...k, label: k.key === "gmv" ? `Facturación (${periodLabel})` : k.label, value: Math.round(k.value * mult) };
      }
      if (k.key === "margin") {
        return { ...k, label: `Margen neto (${periodLabel})` };
      }
      if (k.key === "rep") {
        return { ...k, label: "Reputación (ML)" };
      }
      return k;
    });
  }, [baseKpis, preset, days, periodLabel]);

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
        <div className="flex items-center gap-2">
          <Badge tone="good">Conectable</Badge>
          <Badge tone="warn">Datos: demo</Badge>
        </div>
      </div>

      {/* Período (control principal) */}
      <Card>
        <CardHeader
          title="Período de análisis"
          subtitle="Elegí desde cuándo medir facturación, pedidos y ganancia (UI — sin conexión real todavía)."
          right={<Badge tone="neutral">{periodLabel}</Badge>}
        />
        <CardBody>
          <div className="grid gap-3 md:grid-cols-5">
            <div className="md:col-span-2">
              <div className="text-xs font-semibold text-muted">Preset</div>
              <Select
                className="mt-1"
                value={preset}
                onChange={(e) => setPreset(e.target.value as any)}
              >
                <option value="hoy">Hoy</option>
                <option value="7d">Últimos 7 días</option>
                <option value="15d">Últimos 15 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="mes">Mes actual</option>
                <option value="rango">Rango personalizado</option>
              </Select>
            </div>

            <div className="md:col-span-3 grid grid-cols-2 gap-3">
              <div className={preset === "rango" ? "" : "opacity-50 pointer-events-none"}>
                <div className="text-xs font-semibold text-muted">Desde</div>
                <Input className="mt-1" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div className={preset === "rango" ? "" : "opacity-50 pointer-events-none"}>
                <div className="text-xs font-semibold text-muted">Hasta</div>
                <Input className="mt-1" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="mt-3 text-sm text-muted">
            Días incluidos: <span className="font-semibold text-text">{days}</span>
          </div>
        </CardBody>
      </Card>

      {/* KPI Strip */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
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
        </div>
      </div>

      {/* Reputación & Reclamos (ML) */}
      <Card>
        <CardHeader
          title="Reputación y reclamos (Mercado Libre)"
          subtitle="Resumen tipo plataforma oficial (mock). En etapa 2 se obtiene por API."
          right={<Badge tone="good">Estado: OK</Badge>}
        />
        <CardBody className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-panel2/30 p-4">
            <div className="text-sm font-semibold">Nivel</div>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <div className="text-xl font-semibold">MercadoLíder</div>
                <div className="text-sm text-muted">Semáforo: Verde</div>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-good/20 border border-good/30" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-border bg-panel p-3">
                <div className="text-xs text-muted">Reclamos (60d)</div>
                <div className="mt-1 text-lg font-semibold">2</div>
              </div>
              <div className="rounded-xl border border-border bg-panel p-3">
                <div className="text-xs text-muted">Mediaciones (60d)</div>
                <div className="mt-1 text-lg font-semibold">0</div>
              </div>
              <div className="rounded-xl border border-border bg-panel p-3">
                <div className="text-xs text-muted">Canceladas por vos</div>
                <div className="mt-1 text-lg font-semibold">1</div>
              </div>
              <div className="rounded-xl border border-border bg-panel p-3">
                <div className="text-xs text-muted">Demoras en despacho</div>
                <div className="mt-1 text-lg font-semibold">0</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-panel2/30 p-4">
            <div className="text-sm font-semibold">Actividad (referencia)</div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-panel p-3">
                <div className="text-xs text-muted">Ventas (60d)</div>
                <div className="mt-1 text-lg font-semibold">1.024</div>
              </div>
              <div className="rounded-xl border border-border bg-panel p-3">
                <div className="text-xs text-muted">Con envíos (60d)</div>
                <div className="mt-1 text-lg font-semibold">98%</div>
              </div>
              <div className="rounded-xl border border-border bg-panel p-3">
                <div className="text-xs text-muted">Concretadas (60d)</div>
                <div className="mt-1 text-lg font-semibold">97%</div>
              </div>
              <div className="rounded-xl border border-border bg-panel p-3">
                <div className="text-xs text-muted">Facturado (60d)</div>
                <div className="mt-1 text-lg font-semibold">{ars(156_800_000)}</div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Button variant="secondary">Ver reclamos</Button>
              <Button variant="ghost">Ver reputación</Button>
            </div>
          </div>
        </CardBody>
      </Card>

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
