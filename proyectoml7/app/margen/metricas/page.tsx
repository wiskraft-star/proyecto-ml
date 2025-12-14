"use client";

import { useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { KpiCard } from "@/components/dashboard/kpi-card";

import { ars, compact, dateEs, pct } from "@/lib/format";
import { marginRows, type CostMode, DEFAULT_OPS_RULE } from "@/lib/margen";

const MODES = [
  { label: "Costo WAC (promedio ponderado)", value: "wac" },
  { label: "Último costo", value: "last" },
] as const;

function ymdToDate(s: string) {
  return new Date(s + "T00:00:00Z");
}

export default function MargenMetricasPage() {
  const [mode, setMode] = useState<CostMode>("wac");
  const [q, setQ] = useState("");

  // MVP: costos operativos fijos (luego se toman de Insumos + Mano de obra)
  const [packaging, setPackaging] = useState(DEFAULT_OPS_RULE.packagingPerShipment);
  const [labor, setLabor] = useState(DEFAULT_OPS_RULE.laborPerShipment);

  const all = useMemo(
    () =>
      marginRows({
        costMode: mode,
        opsRule: { ...DEFAULT_OPS_RULE, packagingPerShipment: packaging, laborPerShipment: labor },
      }),
    [mode, packaging, labor]
  );

  const rows = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return all;
    return all.filter((r) => r.orderId.toLowerCase().includes(qq) || r.sku.toLowerCase().includes(qq) || r.title.toLowerCase().includes(qq));
  }, [all, q]);

  const totals = useMemo(() => {
    const net = rows.reduce((a, r) => a + (r.net || 0), 0);
    const gross = rows.reduce((a, r) => a + (r.gross || 0), 0);
    const cogs = rows.reduce((a, r) => a + (r.cogs || 0), 0);
    const insumos = rows.reduce((a, r) => a + (r.packaging || 0), 0);
    const mo = rows.reduce((a, r) => a + (r.labor || 0), 0);
    const marginNet = rows.reduce((a, r) => a + (r.marginNet || 0), 0);
    const marginPct = gross ? marginNet / gross : 0;
    return { gross, net, cogs, insumos, mo, marginNet, marginPct };
  }, [rows]);

  const series = useMemo(() => {
    // agregación diaria (demo). En producción: se toma del período seleccionado.
    const by = new Map<string, { date: string; margin: number; net: number }>();
    for (const r of rows) {
      const cur = by.get(r.date) ?? { date: r.date, margin: 0, net: 0 };
      cur.margin += r.marginNet;
      cur.net += r.net;
      by.set(r.date, cur);
    }
    return Array.from(by.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [rows]);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Métricas (Facturación / Margen neto)" subtitle="Dashboard y tabla venta-por-venta. Se alimenta con Ventas + Cobros + COGS + Insumos + Mano de obra." />
        <CardBody>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por orden/pack, SKU, título…" className="md:w-[360px]" />
              <Select value={mode} onChange={(v) => setMode(v as CostMode)} options={MODES.map((m) => ({ label: m.label, value: m.value }))} />
              <Badge tone="neutral">Filas: {rows.length}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary">Exportar</Button>
              <Button variant="primary">Auditar</Button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-panel2/40 p-3">
              <div className="text-xs font-semibold">Insumos (packaging) por envío físico</div>
              <div className="mt-2 flex items-center gap-2">
                <Input type="number" value={packaging} onChange={(e) => setPackaging(Math.max(0, Number(e.target.value) || 0))} />
                <Badge tone="neutral">{ars(packaging)}</Badge>
              </div>
              <div className="mt-2 text-xs text-muted">MVP: fijo. Luego se toma desde la pestaña Insumos/recetas.</div>
            </div>
            <div className="rounded-2xl border border-border bg-panel2/40 p-3">
              <div className="text-xs font-semibold">Mano de obra por envío físico</div>
              <div className="mt-2 flex items-center gap-2">
                <Input type="number" value={labor} onChange={(e) => setLabor(Math.max(0, Number(e.target.value) || 0))} />
                <Badge tone="neutral">{ars(labor)}</Badge>
              </div>
              <div className="mt-2 text-xs text-muted">MVP: fijo. Luego se toma desde la pestaña Mano de obra/reglas.</div>
            </div>
            <div className="rounded-2xl border border-border bg-panel2/40 p-3">
              <div className="text-xs font-semibold">Definición de margen (MVP)</div>
              <div className="mt-2 text-sm text-muted">Margen neto = Neto “te quedó” − COGS − Insumos − Mano de obra</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge tone="good">Cobros = verdad</Badge>
                <Badge tone="warn">COGS depende compras</Badge>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        <KpiCard title="Neto ‘te quedó’" value={ars(totals.net)} hint="Suma neta por operación (Cobros)." tone="neutral" />
        <KpiCard title="COGS" value={ars(totals.cogs)} hint="Costo mercadería vendida (según modo de costo)." tone="neutral" />
        <KpiCard title="Margen neto real" value={ars(totals.marginNet)} hint={`Margen % sobre bruto: ${pct(totals.marginPct)}`} tone={totals.marginNet >= 0 ? "good" : "bad"} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader title="Evolución (demo)" subtitle="Margen neto y neto por día (agregado)." />
          <CardBody>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                  <XAxis dataKey="date" tickMargin={10} />
                  <YAxis tickFormatter={(v) => compact(v)} />
                  <Tooltip formatter={(v: any) => ars(Number(v))} />
                  <Line type="monotone" dataKey="net" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="margin" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Desglose (totales)" subtitle="Componentes que explican el margen neto." />
          <CardBody>
            <div className="space-y-2">
              <Row label="Facturación bruta" value={ars(totals.gross)} tone="neutral" />
              <Row label="Neto ‘te quedó’" value={ars(totals.net)} tone="neutral" />
              <Row label="COGS" value={ars(-Math.abs(totals.cogs))} tone="warn" />
              <Row label="Insumos" value={ars(-Math.abs(totals.insumos))} tone="warn" />
              <Row label="Mano de obra" value={ars(-Math.abs(totals.mo))} tone="warn" />
              <div className="my-2 border-t border-border" />
              <Row label="Margen neto" value={ars(totals.marginNet)} tone={totals.marginNet >= 0 ? "good" : "bad"} />
              <div className="text-xs text-muted">Margen % (sobre bruto): {pct(totals.marginPct)}</div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Venta por venta" subtitle="Tabla operativa: sirve para auditar precio, costos y ajustes. Aquí se ve dónde se te va el margen." />
        <CardBody>
          <Table>
            <THead>
              <TR>
                <TH>Operación</TH>
                <TH>Fecha</TH>
                <TH>SKU</TH>
                <TH className="text-right">Neto</TH>
                <TH className="text-right">COGS</TH>
                <TH className="text-right">Insumos</TH>
                <TH className="text-right">MO</TH>
                <TH className="text-right">Margen neto</TH>
                <TH className="text-right">Margen %</TH>
                <TH>Calidad</TH>
              </TR>
            </THead>
            <tbody>
              {rows.slice(0, 60).map((r) => {
                const low = r.marginPct < 0.1;
                const neg = r.marginNet < 0;
                const ok = r.costSource !== "missing";
                return (
                  <TR key={r.orderId + r.sku + r.date}>
                    <TD className="font-medium">{r.orderId}</TD>
                    <TD>{dateEs(ymdToDate(r.date))}</TD>
                    <TD>
                      <div className="leading-tight">
                        <div className="font-medium">{r.sku}</div>
                        <div className="text-xs text-muted line-clamp-1">{r.title}</div>
                      </div>
                    </TD>
                    <TD className="text-right">{ars(r.net)}</TD>
                    <TD className="text-right">{ars(-Math.abs(r.cogs))}</TD>
                    <TD className="text-right">{ars(-Math.abs(r.packaging))}</TD>
                    <TD className="text-right">{ars(-Math.abs(r.labor))}</TD>
                    <TD className="text-right font-semibold">{ars(r.marginNet)}</TD>
                    <TD className="text-right">
                      <Badge tone={neg ? "bad" : low ? "warn" : "good"}>{pct(r.marginPct)}</Badge>
                    </TD>
                    <TD>
                      <div className="flex flex-wrap gap-2">
                        <Badge tone={ok ? "good" : "bad"}>COGS: {r.costSource}</Badge>
                        {neg ? <Badge tone="bad">Margen negativo</Badge> : low ? <Badge tone="warn">Bajo</Badge> : <Badge tone="neutral">OK</Badge>}
                      </div>
                    </TD>
                  </TR>
                );
              })}
            </tbody>
          </Table>

          <div className="mt-3 text-xs text-muted">Mostrando {Math.min(60, rows.length)} de {compact(rows.length)} (demo).</div>
        </CardBody>
      </Card>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone: "neutral" | "good" | "warn" | "bad" }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-panel2/40 px-3 py-2">
      <div className="text-sm text-muted">{label}</div>
      <Badge tone={tone}>{value}</Badge>
    </div>
  );
}
