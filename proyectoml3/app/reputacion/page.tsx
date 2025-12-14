"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { pct, dateEs } from "@/lib/format";

type RepLevel = "Platinum" | "Gold" | "Sin medalla";

type RepKpi = {
  key: string;
  label: string;
  value: number;
  tone?: "neutral" | "good" | "warn" | "bad";
  hint?: string;
  format?: "pct" | "raw";
};

type CaseType = "Reclamo" | "Mediación" | "Cancelación" | "Demora" | "Calificación";
type CaseTone = "good" | "warn" | "bad" | "neutral";

type RepCase = {
  id: string;
  type: CaseType;
  orderId?: string;
  date: string; // YYYY-MM-DD
  status: "Abierto" | "En gestión" | "Cerrado";
  reason: string;
  impact: "Alto" | "Medio" | "Bajo";
  tone: CaseTone;
  nextAction: string;
  sla: string;
  tags: string[];
};

const PRESETS = [
  { value: "7d", label: "Últimos 7 días" },
  { value: "15d", label: "Últimos 15 días" },
  { value: "30d", label: "Últimos 30 días" },
  { value: "hoy", label: "Hoy" },
  { value: "mes", label: "Mes actual" },
  { value: "custom", label: "Fecha personalizada" },
] as const;

const COMPARES = [
  { value: "prev", label: "Período anterior" },
  { value: "year", label: "Año anterior" },
  { value: "none", label: "Sin comparación" },
  { value: "custom", label: "Fecha personalizada" },
] as const;

function toneToBadge(tone: CaseTone) {
  if (tone === "bad") return { tone: "bad" as const, label: "Crítico" };
  if (tone === "warn") return { tone: "warn" as const, label: "Atención" };
  if (tone === "good") return { tone: "good" as const, label: "OK" };
  return { tone: "neutral" as const, label: "Info" };
}

export default function ReputacionPage() {
  // UI-only. En etapa de conexión, esto se alimenta con la API de ML.
  const [preset, setPreset] = useState<(typeof PRESETS)[number]["value"]>("7d");
  const [compare, setCompare] = useState<(typeof COMPARES)[number]["value"]>("prev");

  const [from, setFrom] = useState("2025-12-07");
  const [to, setTo] = useState("2025-12-13");

  const [customOpen, setCustomOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  const [tmpFrom, setTmpFrom] = useState(from);
  const [tmpTo, setTmpTo] = useState(to);

  const [compareFrom, setCompareFrom] = useState("2025-11-28");
  const [compareTo, setCompareTo] = useState("2025-12-06");
  const [tmpCompareFrom, setTmpCompareFrom] = useState(compareFrom);
  const [tmpCompareTo, setTmpCompareTo] = useState(compareTo);

  const [tab, setTab] = useState<CaseType>("Reclamo");
  const [picked, setPicked] = useState<RepCase | null>(null);

  const rangeLabel = useMemo(() => {
    const p = PRESETS.find((x) => x.value === preset)?.label ?? "Período";
    if (preset !== "custom") return p;
    return `${dateEs(from)}–${dateEs(to)}`;
  }, [preset, from, to]);

  const compareLabel = useMemo(() => {
    const c = COMPARES.find((x) => x.value === compare)?.label ?? "Comparación";
    if (compare === "custom") return `${dateEs(compareFrom)}–${dateEs(compareTo)}`;
    return c;
  }, [compare, compareFrom, compareTo]);

  const repLevel: RepLevel = "Platinum";
  const repScore = 92; // 0-100 (interno)
  const kpis: RepKpi[] = [
    { key: "claims_rate", label: "Reclamos", value: 0.005, format: "pct", tone: "good", hint: "Porcentaje de reclamos sobre ventas (ventana 60 días en ML)." },
    { key: "mediations_rate", label: "Mediaciones", value: 0.0, format: "pct", tone: "good", hint: "Porcentaje de mediaciones sobre ventas." },
    { key: "cancels_rate", label: "Canceladas por vos", value: 0.0, format: "pct", tone: "good", hint: "Cancelaciones atribuibles al vendedor." },
    { key: "late_rate", label: "Despacho con demora", value: 0.0, format: "pct", tone: "good", hint: "Órdenes despachadas fuera de SLA." },
    { key: "neg_fb", label: "Calificaciones negativas", value: 0.012, format: "pct", tone: "warn", hint: "Negativas + neutras (según configuración)." },
    { key: "cases_open", label: "Casos abiertos", value: 7, format: "raw", tone: "warn", hint: "Backlog de casos que pueden impactar reputación." },
  ];

  const cases: RepCase[] = [
    {
      id: "CLM-24018",
      type: "Reclamo",
      orderId: "2000010200016693",
      date: "2025-12-12",
      status: "En gestión",
      reason: "Comprador reporta falla / apps no responden.",
      impact: "Alto",
      tone: "warn",
      nextAction: "Responder en 2h, pedir evidencia y ofrecer solución (cambio/servicio).",
      sla: "Responder antes de 2h",
      tags: ["Atención a comprador", "Riesgo reputación"],
    },
    {
      id: "CLM-24021",
      type: "Reclamo",
      orderId: "2000010171546565",
      date: "2025-12-11",
      status: "Abierto",
      reason: "Devolución con 'envío negativo' pendiente de registrar.",
      impact: "Medio",
      tone: "warn",
      nextAction: "Registrar costo de devolución y clasificar motivo para aprendizaje.",
      sla: "Procesar hoy",
      tags: ["Finanzas", "Devolución"],
    },
    {
      id: "MED-9003",
      type: "Mediación",
      orderId: "2000010123481413",
      date: "2025-12-09",
      status: "Cerrado",
      reason: "Mediación resuelta a favor del vendedor.",
      impact: "Bajo",
      tone: "good",
      nextAction: "Documentar: argumentos + evidencias que funcionaron.",
      sla: "—",
      tags: ["Playbook", "Evidencias"],
    },
    {
      id: "CAN-1029",
      type: "Cancelación",
      orderId: "2000010124542097",
      date: "2025-12-08",
      status: "Cerrado",
      reason: "Sin stock al momento del despacho.",
      impact: "Alto",
      tone: "bad",
      nextAction: "Reforzar cobertura mínima + alerta automática.",
      sla: "—",
      tags: ["Stock", "Política"],
    },
    {
      id: "SLA-771",
      type: "Demora",
      orderId: "2000010127351765",
      date: "2025-12-07",
      status: "En gestión",
      reason: "Demora en entrega por carrier (investigar tracking).",
      impact: "Medio",
      tone: "warn",
      nextAction: "Proactivo: mensaje al comprador + abrir gestión con carrier.",
      sla: "Resolver en 24h",
      tags: ["Logística", "Proactivo"],
    },
    {
      id: "FB-3301",
      type: "Calificación",
      orderId: "2000010135617651",
      date: "2025-12-06",
      status: "Cerrado",
      reason: "Calificación negativa: 'No era lo esperado'.",
      impact: "Medio",
      tone: "warn",
      nextAction: "Revisar publicación (fotos/título) y checklist de empaquetado.",
      sla: "—",
      tags: ["Publicación", "QA"],
    },
  ];

  const filtered = useMemo(() => cases.filter((c) => c.type === tab), [cases, tab]);

  const alerts = useMemo(() => {
    // heurística interna: priorizar "bad" y "warn" abiertos
    const open = cases.filter((c) => c.status !== "Cerrado");
    const prio = [...open].sort((a, b) => {
      const w = (x: RepCase) => (x.tone === "bad" ? 2 : x.tone === "warn" ? 1 : 0);
      return w(b) - w(a);
    });
    return prio.slice(0, 4);
  }, [cases]);

  const apiChecklist = [
    { area: "Reputación / estado", endpoint: "GET /users/{user_id}", notes: "power_seller_status, metrics (si disponible) y datos básicos." },
    { area: "Métricas (reclamos, demoras)", endpoint: "GET /users/{user_id}/reputation", notes: "Defensivos: manejar campos opcionales según cuenta/site." },
    { area: "Reclamos", endpoint: "Post-Purchase Claims + mensajes", notes: "Bandeja, estados, SLA y plantillas." },
    { area: "Cancelaciones", endpoint: "Orders + reasons", notes: "Clasificación atribuible al vendedor vs comprador." },
    { area: "Envíos / demoras", endpoint: "Shipments + tracking", notes: "SLA por carrier y alerts por atrasos." },
    { area: "Feedback", endpoint: "Orders feedback / ratings", notes: "Negativas, motivos, aprendizaje por SKU." },
  ];

  const scopes = [
    "read:orders, read:shipments (para demoras)",
    "read:claims / post_sale (para reclamos y mensajes)",
    "read:reputation (si aplica en tu app/token)",
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-sm text-muted">Salud de cuenta</div>
          <div className="text-2xl font-semibold tracking-tight">Reputación (Mercado Libre)</div>
          <div className="mt-1 text-sm text-muted">
            Monitoreá las variables que más impactan visibilidad, conversión y costo operativo. (UI — sin conexión real todavía)
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge tone="good">Conectable</Badge>
          <Badge tone="warn">Datos: demo</Badge>
        </div>
      </div>

      {/* Controls — estilo compacto tipo ML */}
<div className="rounded-2xl border border-border bg-panel p-4">
  <div className="grid grid-cols-1 gap-3 md:grid-cols-4 md:items-end">
    <div>
      <div className="mb-1 text-xs text-muted">Período principal</div>
      <Select
        value={preset}
        onChange={(e) => {
          const v = e.target.value as any;
          setPreset(v);
          if (v === "custom") {
            setTmpFrom(from);
            setTmpTo(to);
            setCustomOpen(true);
          }
        }}
      >
        {PRESETS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </Select>
    </div>

    <div>
      <div className="mb-1 text-xs text-muted">Comparar con</div>
      <Select
        value={compare}
        onChange={(e) => {
          const v = e.target.value as any;
          setCompare(v);
          if (v === "custom") {
            setTmpCompareFrom(compareFrom);
            setTmpCompareTo(compareTo);
            setCompareOpen(true);
          }
        }}
      >
        {COMPARES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </Select>
    </div>

    <div className="md:col-span-2">
      <div className="mb-1 text-xs text-muted">Resumen</div>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-panel2/30 px-3 py-2 text-sm">
          <span className="text-muted">📅</span>
          <span className="font-medium">{rangeLabel}</span>
          <span className="text-muted">·</span>
          <span className="text-muted">{compareLabel}</span>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => { /* en conexión real: refetch */ }}>
            Filtrar
          </Button>
        </div>
      </div>
    </div>
  </div>
</div>

{/* Summary */}
      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader title="Estado actual" subtitle="Lectura rápida de salud y nivel." />
          <CardBody>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={repLevel === "Platinum" ? "good" : repLevel === "Gold" ? "warn" : "neutral"}>
                MercadoLíder {repLevel}
              </Badge>
              <Badge tone={repScore >= 90 ? "good" : repScore >= 75 ? "warn" : "bad"}>Score interno: {repScore}/100</Badge>
              <Badge tone="neutral">Ventana: 60 días (referencia ML)</Badge>
            </div>
            <div className="mt-3 text-sm text-muted">
              Objetivo: mantener verde y anticipar desvíos antes de que afecten ranking, conversiones y reclamos.
            </div>
            <div className="mt-4 rounded-2xl border border-border bg-panel2/30 p-4">
              <div className="text-xs text-muted">Puntos sensibles típicos</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
                <li>Reclamos y mediaciones (respuesta + evidencia).</li>
                <li>Cancelaciones atribuibles al vendedor.</li>
                <li>Demoras de despacho/entrega (SLA + proactividad).</li>
                <li>Calidad de publicación y empaquetado (reduce negativos).</li>
              </ul>
            </div>
          </CardBody>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader title="KPIs de reputación" subtitle="Métricas clave (con comparación del período elegido)." />
          <CardBody>
            <div className="grid gap-3 md:grid-cols-3">
              {kpis.map((k) => (
                <KpiCard
                  key={k.key}
                  label={k.label}
                  value={k.value}
                  deltaPct={k.key === "claims_rate" ? -0.001 : k.key === "neg_fb" ? 0.002 : 0.0}
                  tone={k.tone}
                  hint={k.hint}
                  format={k.format === "pct" ? "pct" : "raw"}
                />
              ))}
</div>
          </CardBody>
        </Card>
      </div>

      {/* Alerts */}
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader title="Alertas prioritarias" subtitle="Lo que conviene atender primero para proteger reputación." />
          <CardBody>
            <div className="space-y-2">
              {alerts.length === 0 ? (
                <div className="text-sm text-muted">Sin alertas por el momento.</div>
              ) : (
                alerts.map((a) => {
                  const b = toneToBadge(a.tone);
                  return (
                    <button
                      key={a.id}
                      onClick={() => setPicked(a)}
                      className="w-full rounded-2xl border border-border bg-panel2/30 p-4 text-left transition hover:bg-panel2/50"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge tone={b.tone}>{b.label}</Badge>
                          <div className="text-sm font-semibold">{a.type}: {a.id}</div>
                          {a.orderId ? <div className="text-xs text-muted">Orden {a.orderId}</div> : null}
                        </div>
                        <div className="text-xs text-muted">{dateEs(a.date)} · {a.sla}</div>
                      </div>
                      <div className="mt-2 text-sm text-muted">{a.reason}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {a.tags.slice(0, 3).map((t) => (
                          <span key={t} className="rounded-xl border border-border bg-panel px-2 py-0.5 text-xs text-muted">
                            {t}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Playbook rápido" subtitle="Acciones recomendadas según tipo." />
          <CardBody>
            <div className="space-y-3 text-sm">
              <div className="rounded-2xl border border-border bg-panel2/30 p-4">
                <div className="font-semibold">Reclamo</div>
                <div className="mt-1 text-muted">Responder rápido, pedir evidencia, ofrecer solución clara, documentar todo.</div>
              </div>
              <div className="rounded-2xl border border-border bg-panel2/30 p-4">
                <div className="font-semibold">Demora</div>
                <div className="mt-1 text-muted">Proactividad: mensaje al comprador + gestión con carrier + plan B.</div>
              </div>
              <div className="rounded-2xl border border-border bg-panel2/30 p-4">
                <div className="font-semibold">Cancelación</div>
                <div className="mt-1 text-muted">Evitar stock-out: cobertura mínima + alertas + fallback de abastecimiento.</div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Cases */}
      <Card>
        <CardHeader
          title="Bandeja de casos"
          subtitle="Vista operativa para atacar causas raíz y reducir impacto en reputación."
          right={
            <div className="flex flex-wrap gap-2">
              {(["Reclamo", "Mediación", "Cancelación", "Demora", "Calificación"] as CaseType[]).map((t) => (
                <Button key={t} variant={tab === t ? "secondary" : "ghost"} onClick={() => setTab(t)} size="sm">
                  {t}s
                </Button>
              ))}
            </div>
          }
        />
        <CardBody>
          <Table>
            <THead>
              <TR>
                <TH>Fecha</TH>
                <TH>Tipo</TH>
                <TH>ID</TH>
                <TH>Orden</TH>
                <TH>Estado</TH>
                <TH>Impacto</TH>
                <TH className="hidden lg:table-cell">SLA</TH>
                <TH className="hidden lg:table-cell">Próxima acción</TH>
              </TR>
            </THead>
            <tbody>
              {filtered.map((c) => {
                const b = toneToBadge(c.tone);
                return (
                  <TR key={c.id} className="cursor-pointer" onClick={() => setPicked(c)}>
                    <TD>{dateEs(c.date)}</TD>
                    <TD>{c.type}</TD>
                    <TD className="font-medium">{c.id}</TD>
                    <TD className="text-muted">{c.orderId ?? "—"}</TD>
                    <TD>
                      <div className="flex items-center gap-2">
                        <Badge tone={c.status === "Cerrado" ? "good" : c.status === "En gestión" ? "warn" : "neutral"}>
                          {c.status}
                        </Badge>
                        <Badge tone={b.tone}>{b.label}</Badge>
                      </div>
                    </TD>
                    <TD>{c.impact}</TD>
                    <TD className="hidden lg:table-cell text-muted">{c.sla}</TD>
                    <TD className="hidden lg:table-cell text-muted">{c.nextAction}</TD>
                  </TR>
                );
              })}
            </tbody>
          </Table>
          <div className="mt-3 text-xs text-muted">
            Nota: en etapa de integración, esta bandeja se alimenta con reclamos, envíos, órdenes y feedback. Se agregan reglas de “impacto” y SLA por tipo.
          </div>
        </CardBody>
      </Card>

      {/* API mapping */}
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader title="Datos desde la API" subtitle="Qué endpoints y piezas de información vamos a consumir." />
          <CardBody>
            <Table>
              <THead>
                <TR>
                  <TH>Área</TH>
                  <TH>Fuente</TH>
                  <TH className="hidden md:table-cell">Notas</TH>
                </TR>
              </THead>
              <tbody>
                {apiChecklist.map((r) => (
                  <TR key={r.area}>
                    <TD className="font-medium">{r.area}</TD>
                    <TD className="text-muted">{r.endpoint}</TD>
                    <TD className="hidden md:table-cell text-muted">{r.notes}</TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Permisos y checklist" subtitle="Lo mínimo para que la pestaña sea confiable." />
          <CardBody>
            <div className="rounded-2xl border border-border bg-panel2/30 p-4">
              <div className="text-sm font-semibold">Scopes típicos</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
                {scopes.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="mt-3 rounded-2xl border border-border bg-panel2/30 p-4">
              <div className="text-sm font-semibold">Reglas internas recomendadas</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
                <li>Clasificar “atribuible al vendedor” vs “no controlable”.</li>
                <li>Alertas por SLA: 2h (respuesta), 24h (acción), 72h (cierre).</li>
                <li>Etiquetar por SKU/categoría para atacar causa raíz.</li>
                <li>Registrar costos de devoluciones y envíos negativos para impacto real.</li>
              </ul>
            </div>
          </CardBody>
        </Card>
      </div>

      <Drawer open={!!picked} onClose={() => setPicked(null)} title={picked ? `${picked.type} — ${picked.id}` : ""} width="max-w-2xl">
        {picked ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-panel2/30 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold">Resumen</div>
                <div className="flex items-center gap-2">
                  <Badge tone={picked.status === "Cerrado" ? "good" : picked.status === "En gestión" ? "warn" : "neutral"}>{picked.status}</Badge>
                  <Badge tone={toneToBadge(picked.tone).tone}>{toneToBadge(picked.tone).label}</Badge>
                </div>
              </div>
              <div className="mt-2 text-sm text-muted">{picked.reason}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {picked.tags.map((t) => (
                  <span key={t} className="rounded-xl border border-border bg-panel px-2 py-0.5 text-xs text-muted">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-panel2/30 p-4">
              <div className="text-sm font-semibold">Impacto</div>
              <div className="mt-2 grid gap-2 md:grid-cols-3">
                <div className="rounded-2xl border border-border bg-panel p-3">
                  <div className="text-xs text-muted">Orden</div>
                  <div className="mt-1 text-sm font-semibold">{picked.orderId ?? "—"}</div>
                </div>
                <div className="rounded-2xl border border-border bg-panel p-3">
                  <div className="text-xs text-muted">Prioridad</div>
                  <div className="mt-1 text-sm font-semibold">{picked.impact}</div>
                </div>
                <div className="rounded-2xl border border-border bg-panel p-3">
                  <div className="text-xs text-muted">SLA</div>
                  <div className="mt-1 text-sm font-semibold">{picked.sla}</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-panel2/30 p-4">
              <div className="text-sm font-semibold">Próxima acción</div>
              <div className="mt-2 text-sm text-muted">{picked.nextAction}</div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button>Marcar como en gestión</Button>
                <Button variant="ghost">Abrir plantilla</Button>
                <Button variant="ghost">Adjuntar evidencia</Button>
              </div>
              <div className="mt-3 text-xs text-muted">Acciones simuladas (UI). En conexión real: registrar estado y sincronizar con ML.</div>
            </div>
          </div>
        ) : null}
      </Drawer>

      {/* Custom range modals */}
      <Modal
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        title="Período principal — Fecha personalizada"
      >
        <div className="space-y-3">
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <div className="mb-1 text-xs text-muted">Desde</div>
              <Input type="date" value={tmpFrom} onChange={(e) => setTmpFrom(e.target.value)} />
            </div>
            <div>
              <div className="mb-1 text-xs text-muted">Hasta</div>
              <Input type="date" value={tmpTo} onChange={(e) => setTmpTo(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setCustomOpen(false); setPreset("7d"); }}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setFrom(tmpFrom);
                setTo(tmpTo);
                setCustomOpen(false);
              }}
            >
              Aplicar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        title="Comparación — Fecha personalizada"
      >
        <div className="space-y-3">
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <div className="mb-1 text-xs text-muted">Desde</div>
              <Input type="date" value={tmpCompareFrom} onChange={(e) => setTmpCompareFrom(e.target.value)} />
            </div>
            <div>
              <div className="mb-1 text-xs text-muted">Hasta</div>
              <Input type="date" value={tmpCompareTo} onChange={(e) => setTmpCompareTo(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setCompareOpen(false); setCompare("prev"); }}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setCompareFrom(tmpCompareFrom);
                setCompareTo(tmpCompareTo);
                setCompareOpen(false);
              }}
            >
              Aplicar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
