"use client";

import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { ars, dateEs } from "@/lib/format";

const data = Array.from({ length: 12 }).map((_, i) => {
  const month = i + 1;
  const label = `2025-${String(month).padStart(2, "0")}-01`;
  const gmv = 70_000_000 + i * 8_000_000;
  const net = 12_000_000 + i * 1_200_000 - (i%4===0? 1_000_000:0);
  return { date: label, gmv, net };
});

export default function ReportesPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Reportes" subtitle="Comparativos mensuales y export (modo demo)." right={<Badge tone="neutral">BI liviano</Badge>} />
        <CardBody>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-panel2/30 p-4">
              <div className="text-sm font-semibold">Facturación (12 meses)</div>
              <div className="mt-3 h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <CartesianGrid stroke="rgba(255,255,255,.06)" />
                    <XAxis dataKey="date" tickFormatter={(d)=> new Intl.DateTimeFormat("es-AR",{ month:"short"}).format(new Date(d))} tick={{ fill: "rgba(159,176,195,.9)", fontSize: 12 }} />
                    <YAxis tickFormatter={(v)=> ars(Number(v)).replace(/\u00a0/g,' ')} tick={{ fill: "rgba(159,176,195,.9)", fontSize: 12 }} width={84} />
                    <Tooltip formatter={(v:any)=> ars(Number(v))} labelFormatter={(l:any)=> `Mes: ${l}`} contentStyle={{ background: "rgba(15,26,43,.95)", border: "1px solid rgba(30,42,61,.9)", borderRadius: 12 }} />
                    <Area type="monotone" dataKey="gmv" stroke="rgb(var(--accent))" fill="rgba(77,163,255,.25)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-panel2/30 p-4">
              <div className="text-sm font-semibold">Ganancia neta (12 meses)</div>
              <div className="mt-3 h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <CartesianGrid stroke="rgba(255,255,255,.06)" />
                    <XAxis dataKey="date" tickFormatter={(d)=> new Intl.DateTimeFormat("es-AR",{ month:"short"}).format(new Date(d))} tick={{ fill: "rgba(159,176,195,.9)", fontSize: 12 }} />
                    <YAxis tickFormatter={(v)=> ars(Number(v)).replace(/\u00a0/g,' ')} tick={{ fill: "rgba(159,176,195,.9)", fontSize: 12 }} width={84} />
                    <Tooltip formatter={(v:any)=> ars(Number(v))} labelFormatter={(l:any)=> `Mes: ${l}`} contentStyle={{ background: "rgba(15,26,43,.95)", border: "1px solid rgba(30,42,61,.9)", borderRadius: 12 }} />
                    <Area type="monotone" dataKey="net" stroke="rgb(var(--good))" fill="rgba(46,204,113,.18)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-border bg-panel2/30 p-4 text-sm text-muted">
            En producción: reportes por SKU (contribución), por categoría, por canal, y export para contador/gestión.
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
