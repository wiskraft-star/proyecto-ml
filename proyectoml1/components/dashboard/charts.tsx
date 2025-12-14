"use client";

import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";
import { ars, dateEs } from "@/lib/format";
import type { ExpenseBlock } from "@/lib/mock";

export function TrendChart({ data }: { data: Array<{ date: string; sales: number; costs: number; net: number }> }) {
  return (
    <Card className="bg-grid">
      <CardHeader title="Tendencia (14 días)" subtitle="Ventas vs costos y resultado neto (modo demo)." />
      <CardBody className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="rgba(255,255,255,.06)" />
            <XAxis dataKey="date" tickFormatter={dateEs} tick={{ fill: "rgba(159,176,195,.9)", fontSize: 12 }} />
            <YAxis tickFormatter={(v)=> ars(Number(v)).replace(/ /g,' ')} tick={{ fill: "rgba(159,176,195,.9)", fontSize: 12 }} width={84} />
            <Tooltip
              formatter={(value: any, name: any) => [ars(Number(value)), name]}
              labelFormatter={(label: any) => `Fecha: ${label}`}
              contentStyle={{ background: "rgba(15,26,43,.95)", border: "1px solid rgba(30,42,61,.9)", borderRadius: 12 }}
            />
            <Line type="monotone" dataKey="sales" stroke="rgb(var(--accent))" strokeWidth={2} dot={false} name="Ventas" />
            <Line type="monotone" dataKey="costs" stroke="rgba(159,176,195,.8)" strokeWidth={2} dot={false} name="Costos" />
            <Line type="monotone" dataKey="net" stroke="rgb(var(--good))" strokeWidth={2} dot={false} name="Neto" />
          </LineChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}

export function ExpenseBars({ blocks }: { blocks: ExpenseBlock[] }) {
  const data = blocks.map((b) => ({ name: b.name, value: b.amount }));
  return (
    <Card>
      <CardHeader title="Gastos por bloque" subtitle="Dónde se va el dinero (vista de gestión)." />
      <CardBody className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke="rgba(255,255,255,.06)" />
            <XAxis dataKey="name" tick={{ fill: "rgba(159,176,195,.9)", fontSize: 12 }} interval={0} height={60} />
            <YAxis tickFormatter={(v)=> ars(Number(v)).replace(/ /g,' ')} tick={{ fill: "rgba(159,176,195,.9)", fontSize: 12 }} width={84} />
            <Tooltip
              formatter={(value: any) => ars(Number(value))}
              contentStyle={{ background: "rgba(15,26,43,.95)", border: "1px solid rgba(30,42,61,.9)", borderRadius: 12 }}
            />
            <Bar dataKey="value" fill="rgba(77,163,255,.85)" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}
