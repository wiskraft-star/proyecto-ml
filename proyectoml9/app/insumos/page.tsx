"use client";

import { useMemo, useState } from "react";
import { suppliesMock, salesMock, type SupplyItem, type SupplyPurchase } from "@/lib/mock";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ars, compact } from "@/lib/format";
import { Plus, Search } from "lucide-react";

type View = "resumen" | "maestro" | "compras" | "consumo" | "proyeccion";

function parseDate(s: string) {
  // s: YYYY-MM-DD
  const [y, m, d] = s.split("-").map((n) => Number(n));
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function InsumosPage() {
  const { items: baseItems, purchases: basePurchases, recipes } = suppliesMock();
  const sales = salesMock();

  const [view, setView] = useState<View>("resumen");

  // Período (mismo patrón que dashboard)
  const [preset, setPreset] = useState<"hoy" | "7d" | "15d" | "30d" | "mes" | "custom">("mes");
  const [from, setFrom] = useState("2025-12-01");
  const [to, setTo] = useState("2025-12-13");

  // UI helpers
  const [q, setQ] = useState("");
  const [openAddPurchase, setOpenAddPurchase] = useState(false);

  const { rangeFrom, rangeTo, days } = useMemo(() => {
    const end = preset === "custom" ? parseDate(to) : parseDate("2025-12-13");
    const start =
      preset === "hoy" ? end :
      preset === "7d" ? new Date(end.getTime() - 6 * 864e5) :
      preset === "15d" ? new Date(end.getTime() - 14 * 864e5) :
      preset === "30d" ? new Date(end.getTime() - 29 * 864e5) :
      preset === "mes" ? parseDate("2025-12-01") :
      parseDate(from);

    const d = Math.max(1, Math.round((end.getTime() - start.getTime()) / 864e5) + 1);
    return { rangeFrom: start, rangeTo: end, days: d };
  }, [preset, from, to]);

  const periodLabel = useMemo(() => {
    if (preset === "hoy") return "Hoy";
    if (preset === "7d") return "Últimos 7 días";
    if (preset === "15d") return "Últimos 15 días";
    if (preset === "30d") return "Últimos 30 días";
    if (preset === "mes") return "Mes actual";
    return `${from} → ${to}`;
  }, [preset, from, to]);

  const stdRecipe = useMemo(() => recipes.find((r) => r.id === "std") ?? recipes[0], [recipes]);

  const costPerPack = useMemo(() => {
    const map = new Map(baseItems.map((i) => [i.id, i]));
    return stdRecipe.items.reduce((sum, it) => {
      const item = map.get(it.itemId);
      if (!item) return sum;
      return sum + it.qty * item.costUnit;
    }, 0);
  }, [baseItems, stdRecipe]);

  const packsInPeriod = useMemo(() => {
    const start = rangeFrom.getTime();
    const end = rangeTo.getTime();
    return sales
      .filter((s) => {
        const t = parseDate(s.date).getTime();
        return t >= start && t <= end;
      })
      .filter((s) => !s.sku.startsWith("DIGI")) // digital no consume embalaje
      .reduce((acc, s) => acc + (s.qty ?? 1), 0);
  }, [sales, rangeFrom, rangeTo]);

  const consumptionValue = useMemo(() => packsInPeriod * costPerPack, [packsInPeriod, costPerPack]);

  const purchasesValue = useMemo(() => {
    const start = rangeFrom.getTime();
    const end = rangeTo.getTime();
    return basePurchases
      .filter((p) => {
        const t = parseDate(p.date).getTime();
        return t >= start && t <= end;
      })
      .reduce((acc, p) => acc + p.total, 0);
  }, [basePurchases, rangeFrom, rangeTo]);

  const stockValue = useMemo(() => baseItems.reduce((acc, i) => acc + i.stock * i.costUnit, 0), [baseItems]);

  const avgDailyPacks = useMemo(() => packsInPeriod / days, [packsInPeriod, days]);

  const enriched = useMemo(() => {
    // métricas por insumo
    return baseItems.map((i) => {
      const dailyUnits = avgDailyPacks * i.perPack;
      const coverageDays = dailyUnits > 0 ? i.stock / dailyUnits : 999;
      const safety = dailyUnits * (i.leadTimeDays * 0.5);
      const reorderPoint = dailyUnits * i.leadTimeDays + safety;
      const threshold = Math.max(i.min, reorderPoint);
      const critical = i.stock <= threshold;
      const suggestedBuy = Math.max(0, i.target - i.stock);
      const consumedUnits = packsInPeriod * i.perPack;
      const consumedValue = consumedUnits * i.costUnit;
      const costPerPack = i.perPack * i.costUnit;

      return {
        ...i,
        dailyUnits,
        coverageDays,
        reorderPoint,
        threshold,
        critical,
        suggestedBuy,
        consumedUnits,
        consumedValue,
        costPerPack,
        stockValue: i.stock * i.costUnit,
      };
    });
  }, [baseItems, avgDailyPacks, packsInPeriod]);

  const criticalCount = useMemo(() => enriched.filter((i) => i.critical).length, [enriched]);

  const minCoverage = useMemo(() => {
    const v = enriched.map((i) => i.coverageDays).filter((x) => Number.isFinite(x));
    return v.length ? v.reduce((a, b) => Math.min(a, b), v[0]) : 0;
  }, [enriched]);

  const filteredItems = useMemo(() => {
    const low = q.toLowerCase();
    return enriched
      .filter((i) => `${i.name} ${i.category} ${i.unitBase}`.toLowerCase().includes(low))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [enriched, q]);

  const purchases = useMemo(() => {
    const low = q.toLowerCase();
    const map = new Map(baseItems.map((i) => [i.id, i.name]));
    return basePurchases
      .map((p) => ({ ...p, itemName: map.get(p.itemId) ?? p.itemId }))
      .filter((p) => `${p.itemName} ${p.supplier} ${p.note ?? ""}`.toLowerCase().includes(low))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [basePurchases, baseItems, q]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs text-muted">Inventario</div>
          <h1 className="text-2xl font-semibold tracking-tight">Insumos</h1>
          <div className="mt-1 text-sm text-muted">
            Control de embalajes/consumibles: compras, consumo, stock y proyección (modo demo).
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="w-[220px]">
            <Select value={preset} onChange={(e) => setPreset(e.target.value as any)}>
              <option value="hoy">Hoy</option>
              <option value="7d">Últimos 7 días</option>
              <option value="15d">Últimos 15 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="mes">Mes actual</option>
              <option value="custom">Rango</option>
            </Select>
          </div>

          {preset === "custom" ? (
            <div className="flex items-center gap-2">
              <Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="YYYY-MM-DD" className="w-[140px]" />
              <span className="text-xs text-muted">→</span>
              <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="YYYY-MM-DD" className="w-[140px]" />
            </div>
          ) : null}

          <Badge tone="neutral">Período: {periodLabel}</Badge>
        </div>
      </div>

      {/* Subnav */}
      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              ["resumen", "Resumen"],
              ["maestro", "Maestro"],
              ["compras", "Compras"],
              ["consumo", "Consumo & Stock"],
              ["proyeccion", "Proyección"],
            ].map(([k, label]) => (
              <Button
                key={k}
                variant={view === (k as View) ? "primary" : "secondary"}
                size="sm"
                onClick={() => setView(k as View)}
              >
                {label}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-[260px]">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar insumo / proveedor..." className="pl-9" />
            </div>
            {view === "compras" ? (
              <Button variant="primary" size="sm" onClick={() => setOpenAddPurchase(true)}>
                <Plus className="mr-2 h-4 w-4" /> Cargar compra
              </Button>
            ) : null}
          </div>
        </CardBody>
      </Card>

      {/* Views */}
      {view === "resumen" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Costo insumos por paquete" value={costPerPack} format="ars" hint="Receta: paquete estándar (editable)." />
            <KpiCard label="Consumo insumos (período)" value={consumptionValue} format="ars" hint={`Paquetes estimados: ${packsInPeriod}`} />
            <KpiCard label="Compras insumos (período)" value={purchasesValue} format="ars" hint="Entradas registradas en el período." />
            <KpiCard label="Stock valorizado (actual)" value={stockValue} format="ars" hint="Valor teórico a costo promedio." />
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title="Receta activa" subtitle="Qué se descuenta por cada paquete (estándar)." />
              <CardBody>
                <Table>
                  <THead>
                    <TR>
                      <TH>Insumo</TH>
                      <TH className="text-right">Consumo/paquete</TH>
                      <TH className="text-right">Costo unit.</TH>
                      <TH className="text-right">Costo/paquete</TH>
                    </TR>
                  </THead>
                  <tbody>
                    {filteredItems.map((i) => (
                      <TR key={i.id} className="border-t border-border">
                        <TD>
                          <div className="font-medium">{i.name}</div>
                          <div className="text-xs text-muted">{i.category} · {i.unitBase}</div>
                        </TD>
                        <TD className="text-right">{compact(i.perPack)} {i.unitBase}</TD>
                        <TD className="text-right">{ars(i.costUnit)}</TD>
                        <TD className="text-right font-medium">{ars(i.costPerPack)}</TD>
                      </TR>
                    ))}
                    <TR className="border-t border-border bg-panel2/40">
                      <TD className="font-semibold">Total</TD>
                      <TD />
                      <TD />
                      <TD className="text-right font-semibold">{ars(costPerPack)}</TD>
                    </TR>
                  </tbody>
                </Table>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Alertas" subtitle="Reposición y riesgo de quiebre." />
              <CardBody className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted">Insumos críticos</div>
                  <Badge tone={criticalCount ? "warn" : "good"}>{criticalCount}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted">Cobertura mínima</div>
                  <Badge tone={minCoverage < 7 ? "bad" : minCoverage < 14 ? "warn" : "good"}>
                    {minCoverage >= 999 ? "—" : `${Math.round(minCoverage)} días`}
                  </Badge>
                </div>
                <div className="rounded-2xl border border-border bg-panel p-3 text-sm text-muted">
                  La proyección usa el consumo del período seleccionado y lead time por insumo. En etapa 2 lo conectamos a ventas reales y compras.
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      ) : null}

      {view === "maestro" ? (
        <Card>
          <CardHeader title="Maestro de insumos" subtitle="Definiciones base (unidad, costos, consumos y umbrales)." />
          <CardBody>
            <Table>
              <THead>
                <TR>
                  <TH>Insumo</TH>
                  <TH>Categoría</TH>
                  <TH className="text-right">Stock</TH>
                  <TH className="text-right">Costo unit.</TH>
                  <TH className="text-right">Consumo/paquete</TH>
                  <TH className="text-right">Costo/paquete</TH>
                  <TH className="text-right">Mín.</TH>
                  <TH className="text-right">Objetivo</TH>
                  <TH className="text-right">Lead time</TH>
                </TR>
              </THead>
              <tbody>
                {filteredItems.map((i) => (
                  <TR key={i.id} className="border-t border-border">
                    <TD>
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{i.name}</div>
                        {i.critical ? <Badge tone="warn">Crítico</Badge> : <Badge tone="good">OK</Badge>}
                      </div>
                      <div className="text-xs text-muted">{i.supplier ?? "—"}</div>
                    </TD>
                    <TD className="text-muted">{i.category}</TD>
                    <TD className="text-right">{compact(i.stock)} {i.unitBase}</TD>
                    <TD className="text-right">{ars(i.costUnit)}</TD>
                    <TD className="text-right">{compact(i.perPack)} {i.unitBase}</TD>
                    <TD className="text-right font-medium">{ars(i.costPerPack)}</TD>
                    <TD className="text-right">{compact(i.min)}</TD>
                    <TD className="text-right">{compact(i.target)}</TD>
                    <TD className="text-right">{i.leadTimeDays} d</TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      ) : null}

      {view === "compras" ? (
        <Card>
          <CardHeader title="Compras de insumos" subtitle="Registro de entradas (en la demo es una tabla fija)." />
          <CardBody>
            <Table>
              <THead>
                <TR>
                  <TH>Fecha</TH>
                  <TH>Insumo</TH>
                  <TH>Proveedor</TH>
                  <TH className="text-right">Cantidad</TH>
                  <TH className="text-right">Total</TH>
                  <TH>Nota</TH>
                </TR>
              </THead>
              <tbody>
                {purchases.map((p: any) => (
                  <TR key={p.id} className="border-t border-border">
                    <TD>{p.date}</TD>
                    <TD className="font-medium">{p.itemName}</TD>
                    <TD className="text-muted">{p.supplier}</TD>
                    <TD className="text-right">{compact(p.qty)}</TD>
                    <TD className="text-right font-medium">{ars(p.total)}</TD>
                    <TD className="text-muted">{p.note ?? "—"}</TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </CardBody>

          <Modal open={openAddPurchase} onClose={() => setOpenAddPurchase(false)} title="Cargar compra (demo)">
            <div className="space-y-3">
              <div className="text-sm text-muted">
                En esta etapa dejamos el formulario listo (UI). En etapa 2 lo conectamos a base de datos y recalculamos costo promedio/stock.
              </div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <Input placeholder="Fecha (YYYY-MM-DD)" />
                <Input placeholder="Proveedor" />
                <Select defaultValue="">
                  <option value="" disabled>Insumo</option>
                  {baseItems.map((i) => (<option key={i.id} value={i.id}>{i.name}</option>))}
                </Select>
                <Input placeholder="Cantidad (unidad base)" />
                <Input placeholder="Costo total (ARS)" />
                <Input placeholder="Nota (opcional)" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setOpenAddPurchase(false)}>Cancelar</Button>
                <Button variant="primary" onClick={() => setOpenAddPurchase(false)}>Guardar (demo)</Button>
              </div>
            </div>
          </Modal>
        </Card>
      ) : null}

      {view === "consumo" ? (
        <Card>
          <CardHeader title="Consumo & Stock" subtitle="Consumo teórico según paquetes del período + stock valorizado." />
          <CardBody className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral">Paquetes (estimados): {packsInPeriod}</Badge>
              <Badge tone="neutral">Días del período: {days}</Badge>
            </div>

            <Table>
              <THead>
                <TR>
                  <TH>Insumo</TH>
                  <TH className="text-right">Consumido (u.)</TH>
                  <TH className="text-right">Consumido ($)</TH>
                  <TH className="text-right">Stock (u.)</TH>
                  <TH className="text-right">Stock ($)</TH>
                </TR>
              </THead>
              <tbody>
                {filteredItems.map((i) => (
                  <TR key={i.id} className="border-t border-border">
                    <TD>
                      <div className="font-medium">{i.name}</div>
                      <div className="text-xs text-muted">{i.unitBase}</div>
                    </TD>
                    <TD className="text-right">{compact(i.consumedUnits)}</TD>
                    <TD className="text-right font-medium">{ars(i.consumedValue)}</TD>
                    <TD className="text-right">{compact(i.stock)} {i.unitBase}</TD>
                    <TD className="text-right">{ars(i.stockValue)}</TD>
                  </TR>
                ))}
                <TR className="border-t border-border bg-panel2/40">
                  <TD className="font-semibold">Totales</TD>
                  <TD />
                  <TD className="text-right font-semibold">{ars(consumptionValue)}</TD>
                  <TD />
                  <TD className="text-right font-semibold">{ars(stockValue)}</TD>
                </TR>
              </tbody>
            </Table>

            <div className="rounded-2xl border border-border bg-panel p-3 text-sm text-muted">
              Nota: en etapa 2 el consumo se calcula con pedidos despachados reales y receta por tipo de paquete.
            </div>
          </CardBody>
        </Card>
      ) : null}

      {view === "proyeccion" ? (
        <Card>
          <CardHeader title="Proyección / Reposición" subtitle="Cobertura estimada y sugerencias de compra." />
          <CardBody>
            <Table>
              <THead>
                <TR>
                  <TH>Insumo</TH>
                  <TH className="text-right">Stock</TH>
                  <TH className="text-right">Cobertura</TH>
                  <TH className="text-right">Punto reorden</TH>
                  <TH className="text-right">Sugerido comprar</TH>
                  <TH>Estado</TH>
                </TR>
              </THead>
              <tbody>
                {filteredItems.map((i) => (
                  <TR key={i.id} className="border-t border-border">
                    <TD>
                      <div className="font-medium">{i.name}</div>
                      <div className="text-xs text-muted">Lead time: {i.leadTimeDays} d</div>
                    </TD>
                    <TD className="text-right">{compact(i.stock)} {i.unitBase}</TD>
                    <TD className="text-right">
                      {i.coverageDays >= 999 ? "—" : `${Math.round(i.coverageDays)} d`}
                    </TD>
                    <TD className="text-right">{compact(Math.round(i.threshold))}</TD>
                    <TD className="text-right font-medium">{compact(Math.round(i.suggestedBuy))}</TD>
                    <TD>
                      {i.critical ? <Badge tone="warn">Comprar</Badge> : <Badge tone="good">OK</Badge>}
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>

            <div className="mt-3 rounded-2xl border border-border bg-panel p-3 text-sm text-muted">
              Cálculo demo: consumo promedio diario del período × (lead time + 50% seguridad). Ajustable desde Parámetros en etapa 2.
            </div>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
