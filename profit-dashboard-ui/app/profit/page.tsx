"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  Calendar,
  Download,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  ShieldAlert,
  Tag,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// =========================
// MOCK MODELS (UI ONLY)
// =========================

type SaleStatus = "Entregado" | "En camino" | "Devuelto" | "Cancelado";

type SaleRow = {
  orderId: string;
  dateISO: string; // YYYY-MM-DD
  sku: string;
  title: string;
  qty: number;
  gross: number;
  fees: number;
  shipping: number;
  ads: number;
  refunds: number;
  net: number;
  status: SaleStatus;
};

type ExpenseRow = {
  id: string;
  dateISO: string;
  block:
    | "Operativos"
    | "Insumos"
    | "Servicios"
    | "Sueldos/Retiros"
    | "Impuestos"
    | "Ajustes";
  concept: string;
  amount: number;
  note?: string;
  doc?: string;
};

function ars(n: number) {
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `$ ${Math.round(n).toLocaleString("es-AR")}`;
  }
}

function pct(n: number) {
  const sign = n > 0 ? "+" : "";
  return `${sign}${(n * 100).toFixed(1)}%`;
}

function dayLabel(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function statusBadgeVariant(
  status: SaleStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "Entregado":
      return "default";
    case "En camino":
      return "secondary";
    case "Devuelto":
      return "destructive";
    case "Cancelado":
      return "outline";
  }
}

const mockSales: SaleRow[] = (() => {
  const base: SaleRow[] = [];
  const start = new Date("2025-12-01T00:00:00.000-03:00");
  for (let i = 0; i < 22; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = d.toISOString().slice(0, 10);

    const skuPool = [
      { sku: "REDMI14C-256", title: "Xiaomi Redmi 14C 256GB", gross: 319999 },
      { sku: "ACC-AURIC", title: "Auriculares Bluetooth", gross: 19999 },
      { sku: "ACC-CABLE", title: "Cable USB-C 1m", gross: 8999 },
      { sku: "SKU-OTRO", title: "Producto genérico", gross: 45999 },
    ] as const;

    const pick = skuPool[i % skuPool.length];

    const qty = pick.sku === "ACC-CABLE" ? 2 : 1;
    const gross = pick.gross * qty;
    const fees = Math.round(gross * 0.145);
    const ads = Math.round(gross * (i % 5 === 0 ? 0.05 : 0.018));
    const shipping = i % 4 === 0 ? 0 : Math.round(gross * 0.03);
    const refunds = i % 9 === 0 ? Math.round(gross * 0.95) : 0;
    const net = Math.max(0, gross - fees - ads - shipping - refunds);

    const status: SaleStatus = refunds
      ? "Devuelto"
      : i % 7 === 0
      ? "En camino"
      : "Entregado";

    base.push({
      orderId: `2000010${200000000 + i}`,
      dateISO: iso,
      sku: pick.sku,
      title: pick.title,
      qty,
      gross,
      fees,
      shipping,
      ads,
      refunds,
      net,
      status,
    });
  }
  return base.sort((a, b) => b.dateISO.localeCompare(a.dateISO));
})();

const mockExpenses: ExpenseRow[] = [
  {
    id: "exp-1",
    dateISO: "2025-12-02",
    block: "Operativos",
    concept: "Embalaje (promedio)",
    amount: 200 * 120,
    note: "Mock: 120 envíos",
  },
  {
    id: "exp-2",
    dateISO: "2025-12-02",
    block: "Operativos",
    concept: "Mano de obra",
    amount: 400 * 120,
    note: "Mock: 120 envíos",
  },
  {
    id: "exp-3",
    dateISO: "2025-12-05",
    block: "Insumos",
    concept: "Cinta + film",
    amount: 95150,
  },
  {
    id: "exp-4",
    dateISO: "2025-12-01",
    block: "Servicios",
    concept: "Nubimetrics",
    amount: 39999,
  },
  {
    id: "exp-5",
    dateISO: "2025-12-01",
    block: "Servicios",
    concept: "Hostinger",
    amount: 12999,
  },
  {
    id: "exp-6",
    dateISO: "2025-12-01",
    block: "Servicios",
    concept: "ChatGPT",
    amount: 20999,
  },
  {
    id: "exp-7",
    dateISO: "2025-12-10",
    block: "Impuestos",
    concept: "IVA a pagar (estimado)",
    amount: 450000,
    note: "Mock",
  },
  {
    id: "exp-8",
    dateISO: "2025-12-10",
    block: "Impuestos",
    concept: "IIBB a pagar (estimado)",
    amount: 180000,
    note: "Mock",
  },
  {
    id: "exp-9",
    dateISO: "2025-12-12",
    block: "Ajustes",
    concept: "Nota de crédito ML",
    amount: -72000,
    doc: "NC-ML-0001",
  },
  {
    id: "exp-10",
    dateISO: "2025-12-03",
    block: "Sueldos/Retiros",
    concept: "Sueldo titular",
    amount: 2000000,
  },
];

// Charts mock
const trendData = (() => {
  const d: { day: string; ingresos: number; costos: number; neto: number }[] =
    [];
  const start = new Date("2025-12-01T00:00:00.000-03:00");
  for (let i = 0; i < 15; i++) {
    const dt = new Date(start);
    dt.setDate(start.getDate() + i);
    const iso = dt.toISOString().slice(0, 10);
    const ingresos = 200000 + i * 12000 + (i % 3) * 15000;
    const costos = 130000 + i * 9000 + (i % 4) * 12000;
    const neto = Math.max(0, ingresos - costos);
    d.push({ day: dayLabel(iso), ingresos, costos, neto });
  }
  return d;
})();

function sum<T>(arr: T[], pick: (t: T) => number) {
  return arr.reduce((acc, t) => acc + pick(t), 0);
}

function groupBy<T extends Record<string, any>, K extends string>(
  arr: T[],
  key: K
) {
  const out = new Map<string, T[]>();
  for (const row of arr) {
    const k = String(row[key]);
    if (!out.has(k)) out.set(k, []);
    out.get(k)!.push(row);
  }
  return out;
}

// =========================
// PAGE
// =========================

export default function ProfitDashboardPage() {
  const [month, setMonth] = React.useState("2025-12");
  const [account, setAccount] = React.useState("Todas");
  const [channel, setChannel] = React.useState("Todos");
  const [includeReturned, setIncludeReturned] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [activeChip, setActiveChip] = React.useState<string | null>(null);

  const [detailOpen, setDetailOpen] = React.useState(false);
  const [selectedSale, setSelectedSale] = React.useState<SaleRow | null>(null);

  const [expenseDialogOpen, setExpenseDialogOpen] = React.useState(false);

  const salesFiltered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return mockSales
      .filter((s) => (includeReturned ? true : s.status !== "Devuelto"))
      .filter((s) => {
        if (!q) return true;
        return (
          s.orderId.toLowerCase().includes(q) ||
          s.sku.toLowerCase().includes(q) ||
          s.title.toLowerCase().includes(q)
        );
      })
      .filter((s) => {
        if (!activeChip) return true;
        if (activeChip === "Solo reclamos") return s.status === "Devuelto";
        if (activeChip === "Solo envíos") return s.shipping > 0;
        if (activeChip === "Solo publicidad") return s.ads > 0;
        if (activeChip === "Solo impuestos") return false; // aplica a gastos
        return true;
      });
  }, [query, includeReturned, activeChip]);

  const grossTotal = sum(salesFiltered, (s) => s.gross);
  const feesTotal = sum(salesFiltered, (s) => s.fees);
  const shippingTotal = sum(salesFiltered, (s) => s.shipping);
  const adsTotal = sum(salesFiltered, (s) => s.ads);
  const refundsTotal = sum(salesFiltered, (s) => s.refunds);
  const netTotal = sum(salesFiltered, (s) => s.net);

  const expByBlock = React.useMemo(() => {
    const g = groupBy(mockExpenses, "block");
    const blocks = Array.from(g.entries()).map(([block, rows]) => ({
      block,
      amount: sum(rows, (r) => r.amount),
    }));
    return blocks.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  }, []);

  const expensesTotal = sum(mockExpenses, (e) => e.amount);
  const netAfterExpenses = netTotal - expensesTotal;

  // KPI deltas are mock (UI-only)
  const deltaNet = -0.032;
  const deltaGross = 0.041;
  const deltaRefunds = 0.018;

  const donutData = React.useMemo(() => {
    return [
      { name: "Comisiones", value: feesTotal },
      { name: "Envíos", value: shippingTotal },
      { name: "Publicidad", value: adsTotal },
      { name: "Reintegros", value: refundsTotal },
      { name: "Gastos mes", value: Math.max(0, expensesTotal) },
    ].filter((d) => d.value > 0);
  }, [feesTotal, shippingTotal, adsTotal, refundsTotal, expensesTotal]);

  function openSaleDetail(sale: SaleRow) {
    setSelectedSale(sale);
    setDetailOpen(true);
  }

  function clearFilters() {
    setQuery("");
    setActiveChip(null);
    setIncludeReturned(true);
    setAccount("Todas");
    setChannel("Todos");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto w-full max-w-7xl px-4 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
                  Calculadora real de ganancia
                </h1>
                <Badge variant="outline" className="hidden md:inline-flex">
                  UI / Mock
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Diseño completo primero. Conexión a datos reales en etapa 2.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => setExpenseDialogOpen(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Cargar gasto
              </Button>
              <Button variant="secondary" className="gap-2">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem>Duplicar mes (UI)</DropdownMenuItem>
                  <DropdownMenuItem>Reset mock data</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Ayuda / Glosario</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Filter bar */}
          <div className="mt-4 flex flex-col gap-3 rounded-xl border bg-card p-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Mes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025-12">Diciembre 2025</SelectItem>
                    <SelectItem value="2025-11">Noviembre 2025</SelectItem>
                    <SelectItem value="2025-10">Octubre 2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Select value={account} onValueChange={setAccount}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Cuenta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas">Todas las cuentas</SelectItem>
                  <SelectItem value="ML-AELP">ML AELP</SelectItem>
                  <SelectItem value="ML-ELEA">ML ELEADIGITAL</SelectItem>
                </SelectContent>
              </Select>

              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Mercado Libre">Mercado Libre</SelectItem>
                  <SelectItem value="Shopify">Shopify</SelectItem>
                  <SelectItem value="Transferencia">Transferencia</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Incluir devueltas
                </span>
                <Switch
                  checked={includeReturned}
                  onCheckedChange={setIncludeReturned}
                />
              </div>

              <div className="relative min-w-[260px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por SKU, orden, concepto…"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                "Solo reclamos",
                "Solo envíos",
                "Solo publicidad",
                "Solo impuestos",
              ].map((label) => (
                <Button
                  key={label}
                  variant={activeChip === label ? "default" : "secondary"}
                  size="sm"
                  onClick={() =>
                    setActiveChip((prev) => (prev === label ? null : label))
                  }
                  className="gap-2"
                >
                  <Tag className="h-3.5 w-3.5" />
                  {label}
                </Button>
              ))}
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpiar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-6">
        {/* KPIs */}
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
          <KpiCard
            title="Facturación bruta"
            value={ars(grossTotal)}
            delta={deltaGross}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <KpiCard
            title="Comisiones + cargos"
            value={ars(feesTotal)}
            delta={0.012}
            icon={<TrendingDown className="h-4 w-4" />}
          />
          <KpiCard
            title="Envíos"
            value={ars(shippingTotal)}
            delta={-0.008}
            icon={<TrendingDown className="h-4 w-4" />}
          />
          <KpiCard
            title="Publicidad"
            value={ars(adsTotal)}
            delta={0.021}
            icon={<TrendingDown className="h-4 w-4" />}
          />
          <KpiCard
            title="Reintegros"
            value={ars(refundsTotal)}
            delta={deltaRefunds}
            icon={<ShieldAlert className="h-4 w-4" />}
          />
          <KpiCard
            highlight
            title="Ganancia neta"
            value={ars(netAfterExpenses)}
            delta={deltaNet}
            icon={<BadgeCheck className="h-4 w-4" />}
            footer={
              <span className="text-xs text-muted-foreground">
                Neto ventas: {ars(netTotal)} · Gastos mes: {ars(expensesTotal)}
              </span>
            }
          />
        </div>

        {/* Main grid */}
        <div className="mt-4 grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-4">
            <Card className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>Ingresos vs Costos</CardTitle>
                    <CardDescription>
                      Vista diaria (placeholder). Objetivo: lectura rápida del
                      mes.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" className="gap-2">
                      <ArrowUp className="h-4 w-4" />
                      Zoom
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <ArrowDown className="h-4 w-4" />
                      Comparar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area dataKey="ingresos" type="monotone" />
                    <Area dataKey="costos" type="monotone" />
                    <Area dataKey="neto" type="monotone" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>Ventas del mes</CardTitle>
                    <CardDescription>
                      Tabla completa (UI). Click para ver detalle.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{salesFiltered.length} ventas</Badge>
                    <Button variant="outline" size="sm">
                      Columnas
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[92px]">Fecha</TableHead>
                        <TableHead className="min-w-[170px]">Order</TableHead>
                        <TableHead className="min-w-[120px]">SKU</TableHead>
                        <TableHead className="min-w-[260px]">Título</TableHead>
                        <TableHead className="text-right min-w-[64px]">
                          Cant
                        </TableHead>
                        <TableHead className="text-right min-w-[120px]">
                          Bruto
                        </TableHead>
                        <TableHead className="text-right min-w-[120px]">
                          Fees
                        </TableHead>
                        <TableHead className="text-right min-w-[120px]">
                          Envío
                        </TableHead>
                        <TableHead className="text-right min-w-[120px]">
                          Ads
                        </TableHead>
                        <TableHead className="text-right min-w-[120px]">
                          Reint.
                        </TableHead>
                        <TableHead className="text-right min-w-[120px]">
                          Neto
                        </TableHead>
                        <TableHead className="min-w-[120px]">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesFiltered.slice(0, 12).map((s) => (
                        <TableRow
                          key={s.orderId}
                          className="cursor-pointer"
                          onClick={() => openSaleDetail(s)}
                        >
                          <TableCell className="font-medium">
                            {dayLabel(s.dateISO)}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {s.orderId}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{s.sku}</TableCell>
                          <TableCell className="truncate max-w-[260px]">
                            {s.title}
                          </TableCell>
                          <TableCell className="text-right">{s.qty}</TableCell>
                          <TableCell className="text-right">{ars(s.gross)}</TableCell>
                          <TableCell className="text-right">{ars(s.fees)}</TableCell>
                          <TableCell className="text-right">{ars(s.shipping)}</TableCell>
                          <TableCell className="text-right">{ars(s.ads)}</TableCell>
                          <TableCell className="text-right">{ars(s.refunds)}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {ars(s.net)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusBadgeVariant(s.status)}>{s.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Mostrando 12 de {salesFiltered.length} (paginación: UI)
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      Anterior
                    </Button>
                    <Button variant="outline" size="sm">
                      Siguiente
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Distribución (impacto)</CardTitle>
                <CardDescription>Dónde se va el margen (placeholder).</CardDescription>
              </CardHeader>
              <CardContent className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip />
                    <Legend />
                    <Pie data={donutData} dataKey="value" nameKey="name" />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top drenajes de margen</CardTitle>
                <CardDescription>Ranking operativo (UI).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <RankRow
                  label="Devoluciones / reintegros"
                  value={ars(refundsTotal)}
                  hint="Revisar causas + costos de envío vuelta"
                />
                <RankRow
                  label="Comisiones y cargos"
                  value={ars(feesTotal)}
                  hint="Chequear alícuotas / categoría"
                />
                <RankRow
                  label="Publicidad"
                  value={ars(adsTotal)}
                  hint="Optimizar ACOS / pausar términos"
                />
                <RankRow
                  label="Gastos del mes"
                  value={ars(expensesTotal)}
                  hint="Insumos + mano de obra + servicios"
                />
                <RankRow
                  label="Envíos"
                  value={ars(shippingTotal)}
                  hint="Revisar bonificaciones / cambios"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertas</CardTitle>
                <CardDescription>
                  Señales tempranas. Configurable en etapa 2.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <AlertCard
                  title="Neto por debajo del objetivo"
                  body="Tu ganancia neta estimada está -3.2% vs mes anterior."
                />
                <AlertCard
                  title="Aumentaron devoluciones"
                  body="Los reintegros subieron +1.8%. Revisar reclamos repetidos."
                />
                <AlertCard
                  title="Publicidad alta"
                  body="ACOS estimado por encima del umbral en 2 SKUs."
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6">
          <Tabs defaultValue="resumen">
            <TabsList className="flex flex-wrap justify-start">
              <TabsTrigger value="resumen">Resumen</TabsTrigger>
              <TabsTrigger value="ventas">Ventas</TabsTrigger>
              <TabsTrigger value="gastos">Gastos</TabsTrigger>
              <TabsTrigger value="impuestos">Impuestos</TabsTrigger>
              <TabsTrigger value="devoluciones">Devoluciones</TabsTrigger>
              <TabsTrigger value="stock">Stock</TabsTrigger>
            </TabsList>

            <TabsContent value="resumen" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Objetivos del mes</CardTitle>
                    <CardDescription>Configuración (UI).</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <GoalRow label="Margen neto objetivo" value="20%" />
                    <GoalRow label="ACOS máximo" value="5%" />
                    <GoalRow label="Devoluciones máximo" value="2%" />
                    <GoalRow label="Ticket promedio" value={ars(175000)} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Resumen por bloque</CardTitle>
                    <CardDescription>Totales de gastos del mes (UI).</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {expByBlock.map((b) => (
                        <div
                          key={b.block}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div>
                            <p className="text-sm font-medium">{b.block}</p>
                            <p className="text-xs text-muted-foreground">
                              {Math.abs(b.amount) > 200000 ? "Alto impacto" : "Impacto normal"}
                            </p>
                          </div>
                          <p className="font-semibold">{ars(b.amount)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="ventas" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Ventas (vista extendida)</CardTitle>
                  <CardDescription>Misma tabla, con más acciones (UI).</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Bruto</TableHead>
                          <TableHead className="text-right">Neto</TableHead>
                          <TableHead className="text-right">Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salesFiltered.slice(0, 8).map((s) => (
                          <TableRow key={`ventas-${s.orderId}`}>
                            <TableCell className="font-mono text-xs">{s.orderId}</TableCell>
                            <TableCell className="font-mono text-xs">{s.sku}</TableCell>
                            <TableCell>
                              <Badge variant={statusBadgeVariant(s.status)}>{s.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">{ars(s.gross)}</TableCell>
                            <TableCell className="text-right font-semibold">{ars(s.net)}</TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="outline" onClick={() => openSaleDetail(s)}>
                                Ver
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gastos" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>Gastos del mes</CardTitle>
                      <CardDescription>
                        Acordeón por bloques (UI). Cada bloque con detalle.
                      </CardDescription>
                    </div>
                    <Button onClick={() => setExpenseDialogOpen(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Agregar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" defaultValue={["Operativos"]}>
                    {[
                      "Operativos",
                      "Insumos",
                      "Servicios",
                      "Sueldos/Retiros",
                      "Impuestos",
                      "Ajustes",
                    ].map((block) => (
                      <AccordionItem key={block} value={block}>
                        <AccordionTrigger>
                          <div className="flex w-full items-center justify-between pr-4">
                            <span className="font-medium">{block}</span>
                            <span className="text-sm text-muted-foreground">
                              {ars(
                                sum(
                                  mockExpenses.filter((e) => e.block === block),
                                  (e) => e.amount
                                )
                              )}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="overflow-auto rounded-lg border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="min-w-[92px]">Fecha</TableHead>
                                  <TableHead className="min-w-[260px]">Concepto</TableHead>
                                  <TableHead className="min-w-[160px]">Comprobante</TableHead>
                                  <TableHead className="text-right min-w-[140px]">Monto</TableHead>
                                  <TableHead className="min-w-[240px]">Nota</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {mockExpenses
                                  .filter((e) => e.block === block)
                                  .map((e) => (
                                    <TableRow key={e.id}>
                                      <TableCell>{dayLabel(e.dateISO)}</TableCell>
                                      <TableCell className="font-medium">{e.concept}</TableCell>
                                      <TableCell className="font-mono text-xs">{e.doc ?? "—"}</TableCell>
                                      <TableCell className="text-right font-semibold">{ars(e.amount)}</TableCell>
                                      <TableCell className="text-muted-foreground">{e.note ?? "—"}</TableCell>
                                    </TableRow>
                                  ))}
                              </TableBody>
                            </Table>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="impuestos" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Impuestos</CardTitle>
                    <CardDescription>IVA / IIBB / retenciones (UI).</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {mockExpenses
                      .filter((e) => e.block === "Impuestos")
                      .map((e) => (
                        <div
                          key={`tax-${e.id}`}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div>
                            <p className="text-sm font-medium">{e.concept}</p>
                            <p className="text-xs text-muted-foreground">{e.note ?? "Estimación"}</p>
                          </div>
                          <p className="font-semibold">{ars(e.amount)}</p>
                        </div>
                      ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Retenciones & percepciones</CardTitle>
                    <CardDescription>Placeholder para etapa 2.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: "ARBA", value: 120000 },
                          { name: "SIRCREB", value: 90000 },
                          { name: "IVA", value: 45000 },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="devoluciones" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Devoluciones</CardTitle>
                  <CardDescription>Reclamos, envíos vuelta, reintegros (UI).</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <MiniStat
                      label="Cantidad"
                      value={String(salesFiltered.filter((s) => s.status === "Devuelto").length)}
                    />
                    <MiniStat label="Costo reintegros" value={ars(refundsTotal)} />
                    <MiniStat
                      label="Costo envíos"
                      value={ars(
                        sum(
                          salesFiltered.filter((s) => s.status === "Devuelto"),
                          (s) => s.shipping
                        )
                      )}
                    />
                  </div>

                  <div className="mt-4 overflow-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead className="text-right">Reintegro</TableHead>
                          <TableHead className="text-right">Envío</TableHead>
                          <TableHead>Nota</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salesFiltered
                          .filter((s) => s.status === "Devuelto")
                          .slice(0, 8)
                          .map((s) => (
                            <TableRow key={`ret-${s.orderId}`}>
                              <TableCell className="font-mono text-xs">{s.orderId}</TableCell>
                              <TableCell className="font-mono text-xs">{s.sku}</TableCell>
                              <TableCell className="text-right font-semibold">{ars(s.refunds)}</TableCell>
                              <TableCell className="text-right">{ars(s.shipping)}</TableCell>
                              <TableCell className="text-muted-foreground">
                                Mock: detectar costo de envío vuelta (etapa 2)
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stock" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Stock & mercadería</CardTitle>
                  <CardDescription>Valorización, rotación, compras/ventas (UI).</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <MiniStat label="Stock valorizado" value={ars(28400000)} />
                  <MiniStat label="Unidades en stock" value={String(318)} />
                  <MiniStat label="Rotación (días)" value={String(21)} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Sale detail sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Detalle de venta</SheetTitle>
            <SheetDescription>Desglose operativo. Todo es mock en esta etapa.</SheetDescription>
          </SheetHeader>

          {selectedSale ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Order</p>
                    <p className="font-mono text-sm">{selectedSale.orderId}</p>
                  </div>
                  <Badge variant={statusBadgeVariant(selectedSale.status)}>{selectedSale.status}</Badge>
                </div>
                <div className="mt-3 grid gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">SKU</p>
                    <p className="font-mono text-sm">{selectedSale.sku}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Cantidad</p>
                    <p className="text-sm font-semibold">{selectedSale.qty}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Producto</p>
                    <p className="text-sm font-medium text-right max-w-[260px] truncate">
                      {selectedSale.title}
                    </p>
                  </div>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Desglose</CardTitle>
                  <CardDescription>Bruto → Neto (UI)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <BreakdownRow label="Bruto" value={selectedSale.gross} strong />
                  <BreakdownRow label="Fees" value={-selectedSale.fees} />
                  <BreakdownRow label="Envío" value={-selectedSale.shipping} />
                  <BreakdownRow label="Ads" value={-selectedSale.ads} />
                  <BreakdownRow label="Reintegros" value={-selectedSale.refunds} />
                  <div className="my-2 border-t" />
                  <BreakdownRow label="Neto" value={selectedSale.net} strong />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Timeline</CardTitle>
                  <CardDescription>Eventos del pedido (UI)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <TimelineItem title="Compra" desc="Pago acreditado" />
                  <TimelineItem title="Despacho" desc="Etiqueta generada" />
                  <TimelineItem title="Entrega" desc="Confirmación / tracking" />
                  {selectedSale.status === "Devuelto" ? (
                    <TimelineItem title="Reclamo" desc="Devolución iniciada" />
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notas internas</CardTitle>
                  <CardDescription>Para operación/soporte (UI)</CardDescription>
                </CardHeader>
                <CardContent>
                  <textarea
                    className="min-h-[110px] w-full resize-none rounded-lg border bg-background p-3 text-sm"
                    placeholder="Escribí un comentario interno…"
                  />
                </CardContent>
              </Card>

              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => setDetailOpen(false)}>
                  Cerrar
                </Button>
                <Button>Guardar (UI)</Button>
              </div>
            </div>
          ) : (
            <div className="mt-6 text-sm text-muted-foreground">
              Seleccioná una venta para ver el detalle.
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Add expense dialog (UI only) */}
      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cargar gasto</DialogTitle>
            <DialogDescription>
              Formulario UI. En etapa 2 se valida y se guarda en DB/Sheets.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Bloque</label>
              <Select defaultValue="Operativos">
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Operativos">Operativos</SelectItem>
                  <SelectItem value="Insumos">Insumos</SelectItem>
                  <SelectItem value="Servicios">Servicios</SelectItem>
                  <SelectItem value="Sueldos/Retiros">Sueldos/Retiros</SelectItem>
                  <SelectItem value="Impuestos">Impuestos</SelectItem>
                  <SelectItem value="Ajustes">Ajustes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Concepto</label>
              <Input placeholder="Ej: Cinta, burbuja, Hostinger, etc." />
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Fecha</label>
                <Input type="date" defaultValue="2025-12-13" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Monto (ARS)</label>
                <Input type="number" placeholder="0" />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Comprobante</label>
              <Input placeholder="Ej: FC-0001 / Ticket / NC" />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Nota</label>
              <Input placeholder="Opcional" />
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setExpenseDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setExpenseDialogOpen(false)}>Guardar (UI)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =========================
// UI HELPERS
// =========================

function KpiCard(props: {
  title: string;
  value: string;
  delta: number;
  icon?: React.ReactNode;
  highlight?: boolean;
  footer?: React.ReactNode;
}) {
  const up = props.delta >= 0;
  const Icon = up ? TrendingUp : TrendingDown;

  return (
    <Card className={props.highlight ? "border-primary/40" : undefined}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="flex items-center gap-2">
            {props.icon}
            {props.title}
          </CardDescription>
          <Badge variant="outline" className="gap-1">
            <Icon className="h-3.5 w-3.5" />
            {pct(props.delta)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-2xl font-semibold tracking-tight">{props.value}</div>
        {props.footer ? <div>{props.footer}</div> : null}
      </CardContent>
    </Card>
  );
}

function RankRow(props: { label: string; value: string; hint: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{props.label}</p>
        <p className="text-xs text-muted-foreground truncate">{props.hint}</p>
      </div>
      <p className="text-sm font-semibold whitespace-nowrap">{props.value}</p>
    </div>
  );
}

function AlertCard(props: { title: string; body: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <ShieldAlert className="h-4 w-4 mt-0.5 text-muted-foreground" />
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{props.title}</p>
        <p className="text-xs text-muted-foreground">{props.body}</p>
      </div>
    </div>
  );
}

function GoalRow(props: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <p className="text-sm text-muted-foreground">{props.label}</p>
      <p className="text-sm font-semibold">{props.value}</p>
    </div>
  );
}

function MiniStat(props: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{props.label}</p>
      <p className="mt-1 text-xl font-semibold">{props.value}</p>
    </div>
  );
}

function BreakdownRow(props: { label: string; value: number; strong?: boolean }) {
  const sign = props.value < 0 ? "-" : "";
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">{props.label}</p>
      <p className={props.strong ? "text-sm font-semibold" : "text-sm"}>
        {sign}
        {ars(Math.abs(props.value))}
      </p>
    </div>
  );
}

function TimelineItem(props: { title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 h-2.5 w-2.5 rounded-full border" />
      <div>
        <p className="text-sm font-medium">{props.title}</p>
        <p className="text-xs text-muted-foreground">{props.desc}</p>
      </div>
    </div>
  );
}
