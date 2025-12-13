import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { envOk } from "@/lib/env";
import { ArrowRight, TrendingUp, TrendingDown, Wallet, Package } from "lucide-react";

function MetricCard({
  title,
  subtitle,
  icon: Icon,
  value,
  hint
}: {
  title: string;
  subtitle: string;
  icon: any;
  value: string;
  hint: string;
}) {
  return (
    <Card className="p-0">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{subtitle}</CardDescription>
          </div>
          <div className="rounded-xl bg-zinc-100 p-2 text-zinc-700">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-zinc-900">{value}</div>
        <div className="mt-1 text-xs text-zinc-500">{hint}</div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const ok = envOk();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Panel visual profesional. Cuando confirmes que te gusta, conectamos datos (Supabase / APIs).
          </p>
        </div>
        <Badge className={ok ? "text-emerald-700 border-emerald-200" : "text-rose-700 border-rose-200"}>
          {ok ? "Supabase env OK" : "Falta Supabase env"}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Ventas del mes"
          subtitle="Ingreso bruto"
          icon={TrendingUp}
          value="—"
          hint="Se alimenta desde tu vista/tabla de ventas."
        />
        <MetricCard
          title="Gastos del mes"
          subtitle="Variable + fijo"
          icon={TrendingDown}
          value="—"
          hint="Bloques: comisiones, envíos, insumos, MO, impuestos, etc."
        />
        <MetricCard
          title="Resultado neto"
          subtitle="Neto real"
          icon={Wallet}
          value="—"
          hint="Calculado con tu modelo de costos real (incluye devoluciones)."
        />
        <MetricCard
          title="Stock valorizado"
          subtitle="Inventario"
          icon={Package}
          value="—"
          hint="Total unidades × costo unitario (por SKU)."
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximo paso</CardTitle>
          <CardDescription>Para avanzar sin fricción, vamos en este orden:</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-zinc-700">
            <li>Dejar esta UI cerrada (layout, navegación, estilo y páginas).</li>
            <li>Definir estructura de datos (tablas / vistas) en Supabase acorde a tu modelo.</li>
            <li>Conectar lecturas (dashboard + listados) y luego escritura (altas/edición) si hace falta.</li>
          </ol>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button href="/ventas" variant="primary" className="gap-2">
              Ir a Ventas <ArrowRight className="h-4 w-4" />
            </Button>
            <Button href="/gastos" variant="secondary" className="gap-2">
              Ir a Gastos <ArrowRight className="h-4 w-4" />
            </Button>
            <Button href="/parametros" variant="ghost">
              Parámetros
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
