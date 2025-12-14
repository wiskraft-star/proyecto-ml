"use client";

import { useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { KpiCard } from "@/components/dashboard/kpi-card";

import { ars, compact, dateEs, pct } from "@/lib/format";
import { salesMock, type SaleRow } from "@/lib/mock";

// =====================
// Métricas (Facturación)
// UI-only: se alimenta luego con Orders + Billing/Payments.
// =====================

const PRESETS = [
  { label: "Hoy", value: "hoy" },
  { label: "7 días", value: "7d" },
  { label: "15 días", value: "15d" },
  { label: "30 días", value: "30d" },
  { label: "Mes", value: "mes" },
  { label: "Personalizado", value: "custom" },
] as const;

const COMPARES = [
  { label: "Período anterior", value: "prev" },
  { label: "Mes anterior", value: "prev_month" },
  { label: "No comparar", value: "none" },
  { label: "Personalizado", value: "custom" },
] as const;

function parseYmd(s: string) {
  const [y, m, d] = s.split("-").map((n) => Number(n));
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
}

function fmtYmd(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDaysUTC(d: Date, days: number) {
  return new Date(d.getTime() + days * 864e5);
}

function daysBetweenInclusive(a: Date, b: Date) {
  const start = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const end = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.max(1, Math.floor((end - start) / 864e5) + 1);
}

function shiftMonthUTC(d: Date, deltaMonths: number) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + deltaMonths, d.getUTCDate()));
}

function within(s: string, from: Date, to: Date) {
  const dt = parseYmd(s).getTime();
  return dt >= from.getTime() && dt <= to.getTime();
}

function sumGross(rows: SaleRow[]) {
  return rows.reduce((acc, r) => acc + (r.gross || 0), 0);
}

function sumQty(rows: SaleRow[]) {
  return rows.reduce((acc, r) => acc + (r.qty || 0), 0);
}

function safeDelta(current: number, prev: number) {
  if (!prev) return undefined;
  return current / prev - 1;
}

export default function MetricasFacturacionPage() {
  // Base demo (fija para UI). En producción: hoy = now.
  const demoToday = "2025-12-13";

  const [preset, setPreset] = useState<(typeof PRESETS)[number]["value"]>("7d");
  const [compare, setCompare] = useState<(typeof COMPARES)[number]["value"]>("prev");

  const [from, setFrom] = useState("2025-12-07");
  const [to, setTo] = useState(demoToday);

  const [customOpen, setCustomOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  const [tmpFrom, setTmpFrom] = useState(from);
  const [tmpTo, setTmpTo] = useState(to);

  const [compareFrom, setCompareFrom] = useState("2025-11-28");
  const [compareTo, setCompareTo] = useState("2025-12-06");

  const [q, setQ] = useState("");

  const allSales = useMemo(() => salesMock(), []);

  const { rangeFrom, rangeTo } = useMemo(() => {
    const end = preset === "custom" ? parseYmd(to) : parseYmd(demoToday);
    const start =
      preset === "hoy"
        ? end
        : preset === "7d"
        ? addDaysUTC(end, -6)
        : preset === "15d"
        ? addDaysUTC(end, -14)
        : preset === "30d"
        ? addDaysUTC(end, -29)
        : preset === "mes"
        ? parseYmd("2025-12-01")
        : parseYmd(from);
    return { rangeFrom: start, rangeTo: end };
  }, [preset, from, to]);

  const { cmpFrom, cmpTo } = useMemo(() => {
    const days = daysBetweenInclusive(rangeFrom, rangeTo);
    if (compare === "none") return { cmpFrom: null as Date | null, cmpTo: null as Date | null };
    if (compare === "custom") return { cmpFrom: parseYmd(compareFrom), cmpTo: parseYmd(compareTo) };
    if (compare === "prev_month") return { cmpFrom: shiftMonthUTC(rangeFrom, -1), cmpTo: shiftMonthUTC(rangeTo, -1) };
    // prev period
    const end = addDaysUTC(rangeFrom, -1);
    const start = addDaysUTC(end, -(days - 1));
    return { cmpFrom: start, cmpTo: end };
  }, [compare, rangeFrom, rangeTo, compareFrom, compareTo]);

  const subtitle = useMemo(() => {
    const base = `${dateEs(rangeFrom)} → ${dateEs(rangeTo)}`;
    if (!cmpFrom || !cmpTo) return base;
    if (compare === "custom") return `${base} · Comparando ${compareFrom} → ${compareTo}`;
    return `${base} · Comparando vs ${compare === "prev" ? "período anterior" : "mes anterior"}`;
  }, [rangeFrom, rangeTo, cmpFrom, cmpTo, compare, compareFrom, compareTo]);

  const currentRows = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return allSales.filter((r) => {
      if (!within(r.date, rangeFrom, rangeTo)) return false;
      if (!qq) return true;
      return r.orderId.toLowerCase().includes(qq) || r.sku.toLowerCase().includes(qq) || r.title.toLowerCase().includes(qq);
    });
  }, [allSales, q, rangeFrom, rangeTo]);

  const compareRows = useMemo(() => {
    if (!cmpFrom || !cmpTo) return [] as SaleRow[];
    return allSales.filter((r) => within(r.date, cmpFrom, cmpTo));
  }, [allSales, cmpFrom, cmpTo]);

  const kpis = useMemo(() => {
    const days = daysBetweenInclusive(rangeFrom, rangeTo);
    const gross = sumGross(currentRows);
    const orders = currentRows.length;
    const units = sumQty(currentRows);
    const ticket = orders ? gross / orders : 0;
    const dailyAvg = days ? gross / days : 0;

    const prevGross = sumGross(compareRows);
    const prevOrders = compareRows.length;
    const prevUnits = sumQty(compareRows);
    const prevTicket = prevOrders ? prevGross / prevOrders : 0;
    const prevDailyAvg = days ? prevGross / days : 0;

    const grossDelta = safeDelta(gross, prevGross);
    const ordersDelta = safeDelta(orders, prevOrders);
    const unitsDelta = safeDelta(units, prevUnits);
    const ticketDelta = safeDelta(ticket, prevTicket);
    const dailyAvgDelta = safeDelta(dailyAvg, prevDailyAvg);

    return {
      days,
      gross,
      orders,
      units,
      ticket,
      dailyAvg,
      prevGross,
      grossDelta,
      ordersDelta,
      unitsDelta,
      ticketDelta,
      dailyAvgDelta,
    };
  }, [currentRows, compareRows, rangeFrom, rangeTo]);

  const series = useMemo(() => {
    const days = daysBetweenInclusive(rangeFrom, rangeTo);
    const currentByDay = new Map<string, number>();
    const compareByDay = new Map<string, number>();

    for (const r of currentRows) currentByDay.set(r.date, (currentByDay.get(r.date) ?? 0) + r.gross);
    if (cmpFrom && cmpTo) {
      for (const r of compareRows) compareByDay.set(r.date, (compareByDay.get(r.date) ?? 0) + r.gross);
    }

    const out: Array<{ date: string; actual: number; prev?: number }> = [];
    for (let i = 0; i < days; i++) {
      const d = addDaysUTC(rangeFrom, i);
      const key = fmtYmd(d);
      const actual = currentByDay.get(key) ?? 0;

      let prev: number | undefined = undefined;
      if (cmpFrom && cmpTo) {
        // Alineación por posición (día 1 del período vs día 1 del comparado)
        const dPrev = addDaysUTC(cmpFrom, i);
        prev = compareByDay.get(fmtYmd(dPrev)) ?? 0;
      }

      out.push({ date: key, actual, prev });
    }
    return out;
  }, [currentRows, compareRows, rangeFrom, rangeTo, cmpFrom, cmpTo]);

  const bySku = useMemo(() => {
    const map = new Map<string, { sku: string; title: string; gross: number; orders: number; units: number }>();
    for (const r of currentRows) {
      const key = r.sku;
      const cur = map.get(key) ?? { sku: r.sku, title: r.title, gross: 0, orders: 0, units: 0 };
      cur.gross += r.gross;
      cur.orders += 1;
      cur.units += r.qty;
      map.set(key, cur);
    }
    const rows = Array.from(map.values()).sort((a, b) => b.gross - a.gross);
    return rows;
  }, [currentRows]);

  const byChannel = useMemo(() => {
    // UI: aproximación. En producción: canal real (catálogo vs publicación propia, full/ME, etc.).
    const agg: Record<string, { channel: string; gross: number; orders: number; units: number }> = {
      "Catálogo": { channel: "Catálogo", gross: 0, orders: 0, units: 0 },
      "Propia": { channel: "Propia", gross: 0, orders: 0, units: 0 },
    };
    for (const r of currentRows) {
      const channel = r.sku.startsWith("REDMI") ? "Catálogo" : "Propia";
      agg[channel].gross += r.gross;
      agg[channel].orders += 1;
      agg[channel].units += r.qty;
    }
    return Object.values(agg).sort((a, b) => b.gross - a.gross);
  }, [currentRows]);

  const byStatus = useMemo(() => {
    const agg = new Map<SaleRow["status"], { status: SaleRow["status"]; gross: number; orders: number }>();
    for (const r of currentRows) {
      const cur = agg.get(r.status) ?? { status: r.status, gross: 0, orders: 0 };
      cur.gross += r.gross;
      cur.orders += 1;
      agg.set(r.status, cur);
    }
    return Array.from(agg.values()).sort((a, b) => b.gross - a.gross);
  }, [currentRows]);

  const alerts = useMemo(() => {
    const out: Array<{ tone: "good" | "warn" | "bad" | "neutral"; title: string; detail: string }> = [];
    const d = kpis.grossDelta ?? 0;
    if (typeof kpis.grossDelta === "number" && kpis.prevGross > 0) {
      if (d <= -0.12) {
        out.push({ tone: "bad", title: "Caída de facturación", detail: `La facturación cayó ${pct(Math.abs(d))} vs el período comparado.` });
      } else if (d <= -0.06) {
        out.push({ tone: "warn", title: "Facturación por debajo", detail: `La facturación está ${pct(Math.abs(d))} debajo del período comparado.` });
      } else if (d >= 0.08) {
        out.push({ tone: "good", title: "Crecimiento", detail: `La facturación subió ${pct(d)} vs el período comparado.` });
      }
    }

    const top = bySku[0];
    if (top && kpis.gross > 0) {
      const share = top.gross / kpis.gross;
      if (share >= 0.45) {
        out.push({ tone: "warn", title: "Dependencia de un SKU", detail: `${top.sku} explica ${pct(share)} de la facturación del período.` });
      }
    }

    if (typeof kpis.ticketDelta === "number" && kpis.ticketDelta <= -0.08) {
      out.push({ tone: "warn", title: "Ticket promedio bajando", detail: `Ticket promedio ${pct(Math.abs(kpis.ticketDelta))} abajo vs comparación (posibles descuentos/competencia).` });
    }

    if (!out.length) out.push({ tone: "neutral", title: "Sin alertas críticas", detail: "La facturación luce estable para el período seleccionado (modo demo)." });
    return out;
  }, [kpis.grossDelta, kpis.prevGross, kpis.ticketDelta, kpis.gross, bySku]);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Métricas · Facturación"
          subtitle={subtitle}
          right={
            <div className="flex items-center gap-2">
              <Select
                className="h-9 w-[140px]"
                value={preset}
                onChange={(e) => {
                  const v = e.target.value as any;
                  setPreset(v);
                  if (v === "custom") setCustomOpen(true);
                }}
              >
                {PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </Select>

              <Select
                className="h-9 w-[180px]"
                value={compare}
                onChange={(e) => {
                  const v = e.target.value as any;
                  setCompare(v);
                  if (v === "custom") setCompareOpen(true);
                }}
              >
                {COMPARES.map((c) => (
                  <option key={c.value} value={c.value}>
                    Comparar: {c.label}
                  </option>
                ))}
              </Select>

              <Input
                className="h-9 w-[220px]"
                placeholder="Buscar (SKU / orden / título)…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />

              <Button variant="secondary" className="h-9 border border-slate-200/60 bg-transparent hover:bg-slate-50">
                Refrescar
              </Button>
            </div>
          }
        />

        <CardBody className="grid gap-3 md:grid-cols-6">
          <KpiCard label="Facturación bruta" value={kpis.gross} deltaPct={kpis.grossDelta} format="ars" tone={kpis.grossDelta && kpis.grossDelta < -0.06 ? "warn" : "neutral"} hint="Total vendido en el período." />
          <KpiCard label="Pedidos" value={kpis.orders} deltaPct={kpis.ordersDelta} format="raw" hint="Órdenes (modo demo)." />
          <KpiCard label="Unidades" value={kpis.units} deltaPct={kpis.unitsDelta} format="raw" hint="Cantidad total de ítems." />
          <KpiCard label="Ticket promedio" value={kpis.ticket} deltaPct={kpis.ticketDelta} format="ars" hint="Facturación / pedidos." />
          <KpiCard label="Promedio diario" value={kpis.dailyAvg} deltaPct={kpis.dailyAvgDelta} format="ars" hint="Facturación / días." />
          <KpiCard label="SKUs activos" value={bySku.length} format="raw" hint="SKUs con al menos una venta." />
        </CardBody>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Facturación por día" subtitle="Serie diaria del período (con comparación si aplica)." right={<Badge tone="neutral">Demo</Badge>} />
          <CardBody className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid stroke="rgba(255,255,255,.06)" />
                <XAxis dataKey="date" tickFormatter={dateEs} tick={{ fill: "rgba(159,176,195,.9)", fontSize: 12 }} />
                <YAxis tickFormatter={(v) => ars(Number(v)).replace(/\u00a0/g, " ")} tick={{ fill: "rgba(159,176,195,.9)", fontSize: 12 }} width={92} />
                <Tooltip
                  formatter={(v: any, name: any) => [ars(Number(v)), name === "actual" ? "Actual" : "Comparación"]}
                  labelFormatter={(l: any) => `Fecha: ${l}`}
                  contentStyle={{ background: "rgba(15,26,43,.95)", border: "1px solid rgba(30,42,61,.9)", borderRadius: 12 }}
                />
                <Line type="monotone" dataKey="actual" stroke="rgb(var(--accent))" strokeWidth={2} dot={false} />
                {cmpFrom && cmpTo ? (
                  <Line type="monotone" dataKey="prev" stroke="rgba(159,176,195,.75)" strokeWidth={2} dot={false} />
                ) : null}
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Alertas" subtitle="Señales rápidas sobre facturación." right={<Badge tone="warn">Acción</Badge>} />
          <CardBody className="space-y-3">
            {alerts.map((a, i) => (
              <div key={i} className="rounded-2xl border border-border bg-panel2/30 p-4">
                <div className="flex items-center gap-2">
                  <Badge tone={a.tone === "neutral" ? "neutral" : a.tone}>{a.tone === "neutral" ? "Info" : a.tone.toUpperCase()}</Badge>
                  <div className="text-sm font-semibold">{a.title}</div>
                </div>
                <div className="mt-2 text-sm text-muted">{a.detail}</div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Top SKUs" subtitle="Qué está explicando la facturación (Top 10)." right={<Badge tone="neutral">Ranking</Badge>} />
          <CardBody>
            <Table>
              <THead>
                <TR>
                  <TH>SKU</TH>
                  <TH>Título</TH>
                  <TH className="text-right">Facturación</TH>
                  <TH className="text-right">Pedidos</TH>
                  <TH className="text-right">Unidades</TH>
                  <TH className="text-right">Share</TH>
                </TR>
              </THead>
              <tbody>
                {bySku.slice(0, 10).map((r) => (
                  <TR key={r.sku}>
                    <TD className="font-medium">{r.sku}</TD>
                    <TD className="text-muted">{r.title}</TD>
                    <TD className="text-right">{ars(r.gross).replace(/\u00a0/g, " ")}</TD>
                    <TD className="text-right">{r.orders}</TD>
                    <TD className="text-right">{r.units}</TD>
                    <TD className="text-right">{kpis.gross ? pct(r.gross / kpis.gross) : "0%"}</TD>
                  </TR>
                ))}
              </tbody>
            </Table>

            <div className="mt-4 rounded-2xl border border-border bg-panel2/30 p-4 text-sm text-muted">
              En producción: filtros por canal, marketplace (MLA), y drill-down a la pestaña Ventas.
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Desgloses" subtitle="Lectura rápida por canal y por estado." right={<Badge tone="neutral">Resumen</Badge>} />
          <CardBody className="space-y-4">
            <div className="rounded-2xl border border-border bg-panel2/30 p-4">
              <div className="text-sm font-semibold">Por canal</div>
              <div className="mt-3 space-y-2 text-sm">
                {byChannel.map((c) => (
                  <div key={c.channel} className="flex items-center justify-between gap-3">
                    <div className="text-muted">{c.channel}</div>
                    <div className="font-semibold">{compact(c.gross)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-panel2/30 p-4">
              <div className="text-sm font-semibold">Por estado</div>
              <div className="mt-3 space-y-2 text-sm">
                {byStatus.map((s) => (
                  <div key={s.status} className="flex items-center justify-between gap-3">
                    <div className="text-muted">{s.status}</div>
                    <div className="font-semibold">{compact(s.gross)}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Modal período personalizado */}
      <Modal
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        title="Período personalizado"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <div className="text-xs text-muted">Desde</div>
            <Input value={tmpFrom} onChange={(e) => setTmpFrom(e.target.value)} placeholder="YYYY-MM-DD" />
          </div>
          <div>
            <div className="text-xs text-muted">Hasta</div>
            <Input value={tmpTo} onChange={(e) => setTmpTo(e.target.value)} placeholder="YYYY-MM-DD" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={() => setCustomOpen(false)}>Cancelar</Button>
          <Button
            variant="primary"
            onClick={() => {
              setFrom(tmpFrom);
              setTo(tmpTo);
              setPreset("custom");
              setCustomOpen(false);
            }}
          >
            Aplicar
          </Button>
        </div>
      </Modal>

      {/* Modal comparación personalizada */}
      <Modal
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        title="Comparación personalizada"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <div className="text-xs text-muted">Desde</div>
            <Input value={compareFrom} onChange={(e) => setCompareFrom(e.target.value)} placeholder="YYYY-MM-DD" />
          </div>
          <div>
            <div className="text-xs text-muted">Hasta</div>
            <Input value={compareTo} onChange={(e) => setCompareTo(e.target.value)} placeholder="YYYY-MM-DD" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={() => setCompareOpen(false)}>Cancelar</Button>
          <Button
            variant="primary"
            onClick={() => {
              setCompare("custom");
              setCompareOpen(false);
            }}
          >
            Aplicar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
