"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ars, compact } from "@/lib/format";
import {
  stockMock,
  stockPurchasesMock,
  stockSkuMasterMock,
  type StockPurchase,
  type StockSkuMaster,
} from "@/lib/mock";
import { Search } from "lucide-react";

type View = "resumen" | "compras" | "wac" | "maestro" | "valorizacion" | "proyeccion";

function parseDate(s: string) {
  const [y, m, d] = s.split("-").map((x) => Number(x));
  return new Date(y, (m || 1) - 1, d || 1);
}

function inRange(dateISO: string, from: Date, to: Date) {
  const d = parseDate(dateISO);
  return d.getTime() >= from.getTime() && d.getTime() <= to.getTime();
}

export default function StockPage() {
  const stockRows = useMemo(() => stockMock(), []);
  const master = useMemo(() => stockSkuMasterMock(), []);
  const purchases = useMemo(() => stockPurchasesMock(), []);

  const [view, setView] = useState<View>("resumen");

  // Período (modo demo, igual que Insumos)
  const [preset, setPreset] = useState<"hoy" | "7d" | "15d" | "30d" | "mes" | "custom">("mes");
  const [from, setFrom] = useState("2025-12-01");
  const [to, setTo] = useState("2025-12-13");

  const [q, setQ] = useState("");

  const { rangeFrom, rangeTo } = useMemo(() => {
    const end = preset === "custom" ? parseDate(to) : parseDate("2025-12-13");
    const start =
      preset === "hoy"
        ? end
        : preset === "7d"
        ? new Date(end.getTime() - 6 * 864e5)
        : preset === "15d"
        ? new Date(end.getTime() - 14 * 864e5)
        : preset === "30d"
        ? new Date(end.getTime() - 29 * 864e5)
        : preset === "mes"
        ? parseDate("2025-12-01")
        : parseDate(from);

    return { rangeFrom: start, rangeTo: end };
  }, [preset, from, to]);

  // Index helpers
  const stockBySku = useMemo(() => {
    const m = new Map<string, (typeof stockRows)[number]>();
    stockRows.forEach((r) => m.set(r.sku, r));
    return m;
  }, [stockRows]);

  const masterBySku = useMemo(() => {
    const m = new Map<string, StockSkuMaster>();
    master.forEach((x) => m.set(x.sku, x));
    return m;
  }, [master]);

  // Purchases within period
  const purchasesInRange = useMemo(() => {
    const filtered = purchases.filter((p) => inRange(p.date, rangeFrom, rangeTo));
    if (!q.trim()) return filtered;
    const qq = q.toLowerCase();
    return filtered.filter((p) => {
      const m = masterBySku.get(p.sku);
      return (
        p.id.toLowerCase().includes(qq) ||
        p.sku.toLowerCase().includes(qq) ||
        p.supplier.toLowerCase().includes(qq) ||
        (m?.model.toLowerCase().includes(qq) ?? false)
      );
    });
  }, [purchases, rangeFrom, rangeTo, q, masterBySku]);

  // WAC (Weighted Average Cost / AVCO) from purchases (all time, not only range)
  const wacBySku = useMemo(() => {
    const agg = new Map<string, { qty: number; cost: number; last?: string }>();
    purchases.forEach((p) => {
      const cur = agg.get(p.sku) ?? { qty: 0, cost: 0, last: undefined };
      cur.qty += p.qty;
      cur.cost += p.totalCost;
      cur.last = !cur.last || p.date > cur.last ? p.date : cur.last;
      agg.set(p.sku, cur);
    });

    const out = new Map<string, { wac: number; qty: number; cost: number; last?: string }>();
    master.forEach((m) => {
      const a = agg.get(m.sku);
      const fallback = m.unitCostFallback ?? 0;
      const qty = a?.qty ?? 0;
      const cost = a?.cost ?? 0;
      const wac = qty > 0 ? cost / qty : fallback;
      out.set(m.sku, { wac, qty, cost, last: a?.last });
    });

    return out;
  }, [purchases, master]);

  // Valuation rows (join stock + master + WAC)
  const valuationRows = useMemo(() => {
    const rows = master.map((m) => {
      const s = stockBySku.get(m.sku);
      const onHand = s?.onHand ?? 0;
      const committed = s?.committed ?? 0;
      const available = s?.available ?? onHand;
      const daysCover = s?.daysCover ?? 0;
      const vel = s?.velocity ?? "Media";
      const w = wacBySku.get(m.sku);
      const wac = w?.wac ?? 0;

      const capital = onHand * wac;
      const revenuePotential = onHand * m.salePriceEstimate;
      const marginPotential = revenuePotential - capital;

      return {
        sku: m.sku,
        model: m.model,
        category: m.category,
        mlas: m.mlas,
        onHand,
        available,
        committed,
        daysCover,
        velocity: vel,
        wac,
        capital,
        salePrice: m.salePriceEstimate,
        revenuePotential,
        marginPotential,
        leadTimeDays: m.leadTimeDays,
        minStock: m.minStock,
        targetStock: m.targetStock,
      };
    });

    // keep stable order: critical first, then by capital desc
    return rows.sort((a, b) => {
      const aCrit = a.category !== "Digital" && a.onHand <= a.minStock ? 1 : 0;
      const bCrit = b.category !== "Digital" && b.onHand <= b.minStock ? 1 : 0;
      if (aCrit !== bCrit) return bCrit - aCrit;
      return b.capital - a.capital;
    });
  }, [master, stockBySku, wacBySku]);

  const kpis = useMemo(() => {
    const physical = valuationRows.filter((r) => r.category !== "Digital");
    const unitsTotal = physical.reduce((a, r) => a + r.onHand, 0);
    const capitalTotal = physical.reduce((a, r) => a + r.capital, 0);
    const revenuePotentialTotal = physical.reduce((a, r) => a + r.revenuePotential, 0);
    const marginPotentialTotal = physical.reduce((a, r) => a + r.marginPotential, 0);

    // Alert: min stock
    const minRow = physical
      .slice()
      .sort((a, b) => a.onHand - b.onHand)[0];

    const criticalCount = physical.filter((r) => r.onHand <= r.minStock).length;

    return {
      unitsTotal,
      capitalTotal,
      revenuePotentialTotal,
      marginPotentialTotal,
      minSku: minRow?.sku ?? "-",
      minSkuQty: minRow?.onHand ?? 0,
      criticalCount,
    };
  }, [valuationRows]);

  const projectionRows = useMemo(() => {
    return valuationRows
      .filter((r) => r.category !== "Digital")
      .map((r) => {
        const avgDaily = r.daysCover > 0 ? r.onHand / r.daysCover : 0;
        const safety = avgDaily * (r.leadTimeDays * 0.5);
        const reorderPoint = avgDaily * r.leadTimeDays + safety;
        const coverageDays = avgDaily > 0 ? r.onHand / avgDaily : 999;

        const status =
          r.onHand <= r.minStock ? "Crítico" : r.onHand <= reorderPoint ? "Riesgo" : "OK";

        const suggested = Math.max(0, Math.round(r.targetStock - r.onHand));

        return {
          ...r,
          avgDaily,
          safety,
          reorderPoint,
          coverageDays,
          status,
          suggested,
        };
      })
      .sort((a, b) => {
        const order = { "Crítico": 0, "Riesgo": 1, OK: 2 } as const;
        if (order[a.status as keyof typeof order] !== order[b.status as keyof typeof order]) {
          return order[a.status as keyof typeof order] - order[b.status as keyof typeof order];
        }
        return a.coverageDays - b.coverageDays;
      });
  }, [valuationRows]);

  const purchasesTotals = useMemo(() => {
    const total = purchasesInRange.reduce((a, p) => a + p.totalCost, 0);
    const qty = purchasesInRange.reduce((a, p) => a + p.qty, 0);
    return { total, qty };
  }, [purchasesInRange]);

  const headerPeriodLabel =
    preset === "hoy"
      ? "Hoy"
      : preset === "7d"
      ? "Últimos 7 días"
      : preset === "15d"
      ? "Últimos 15 días"
      : preset === "30d"
      ? "Últimos 30 días"
      : preset === "mes"
      ? "Mes actual"
      : "Rango";

  const navTabs: { key: View; label: string }[] = [
    { key: "resumen", label: "Resumen" },
    { key: "compras", label: "Compras" },
    { key: "wac", label: "WAC" },
    { key: "maestro", label: "Maestro ML" },
    { key: "valorizacion", label: "Valorización" },
    { key: "proyeccion", label: "Proyección" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm text-muted">Inventario</div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">Stock</h1>
            <Badge tone="good">Conectable</Badge>
            <Badge tone="neutral">Datos: demo</Badge>
          </div>
          <div className="mt-1 text-sm text-muted">
            Compras + WAC (costo promedio) + valorización + proyección (modo demo, sin API).
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-panel2/30 px-3 py-2">
            <span className="text-xs text-muted">Período</span>
            <Select value={preset} onChange={(e) => setPreset(e.target.value as any)} className="w-[160px]">
              <option value="hoy">Hoy</option>
              <option value="7d">Últimos 7 días</option>
              <option value="15d">Últimos 15 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="mes">Mes actual</option>
              <option value="custom">Rango</option>
            </Select>
            {preset === "custom" ? (
              <div className="flex items-center gap-2">
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[150px]" />
                <span className="text-xs text-muted">a</span>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[150px]" />
              </div>
            ) : null}
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" />
            <Input
              placeholder="Buscar SKU, modelo, proveedor…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-[260px] pl-9"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {navTabs.map((t) => (
          <Button
            key={t.key}
            variant={view === t.key ? "primary" : "secondary"}
            onClick={() => setView(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {/* RESUMEN */}
      {view === "resumen" ? (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <KpiCard label="Unidades (físico)" value={kpis.unitsTotal} format="raw" hint="Stock on hand (excluye digitales)." />
            <KpiCard label="Capital en stock" value={kpis.capitalTotal} format="ars" hint="Valorizado a WAC (costo promedio)." />
            <KpiCard label="Facturación potencial" value={kpis.revenuePotentialTotal} format="ars" hint="On hand × precio estimado." />
            <KpiCard label="Margen potencial" value={kpis.marginPotentialTotal} format="ars" hint="Potencial − capital a costo." />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader title="Alertas" />
              <CardBody>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">SKU con menor stock</span>
                    <span className="font-medium">
                      {kpis.minSku} <span className="text-muted">({kpis.minSkuQty} u.)</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">SKUs en crítico</span>
                    <span className="font-medium">{kpis.criticalCount}</span>
                  </div>
                  <div className="rounded-2xl border border-border bg-panel2/30 p-3 text-muted">
                    Reglas demo: Crítico si <span className="font-medium">onHand ≤ mínimo</span>. Proyección usa cobertura + lead time.
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader title="Top SKUs por capital inmovilizado" subtitle={`Período: ${headerPeriodLabel}`} />
              <CardBody>
                <Table>
                  <THead>
                    <TR>
                      <TH>SKU</TH>
                      <TH>Modelo</TH>
                      <TH className="text-right">Stock</TH>
                      <TH className="text-right">WAC</TH>
                      <TH className="text-right">Capital</TH>
                      <TH>Estado</TH>
                    </TR>
                  </THead>
                  <tbody>
                    {valuationRows
                      .filter((r) => r.category !== "Digital")
                      .slice(0, 6)
                      .map((r) => {
                        const isCrit = r.onHand <= r.minStock;
                        return (
                          <TR key={r.sku}>
                            <TD className="font-medium">{r.sku}</TD>
                            <TD className="text-muted">{r.model}</TD>
                            <TD className="text-right">{compact(r.onHand)}</TD>
                            <TD className="text-right">{ars(r.wac)}</TD>
                            <TD className="text-right">{ars(r.capital)}</TD>
                            <TD>
                              {isCrit ? <Badge tone="bad">Crítico</Badge> : <Badge tone="good">OK</Badge>}
                            </TD>
                          </TR>
                        );
                      })}
                  </tbody>
                </Table>

                <div className="mt-3 rounded-2xl border border-border bg-panel2/30 p-3 text-sm text-muted">
                  En etapa 2: entra consumo por ventas reales, movimientos, lotes/IMEI, y sync con ML.
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      ) : null}

      {/* COMPRAS */}
      {view === "compras" ? (
        <Card>
          <CardHeader
            title="Compras de mercadería"
            subtitle={`Período: ${headerPeriodLabel} · Entradas: ${compact(purchasesTotals.qty)} u. · Total: ${ars(purchasesTotals.total)}`}
            right={<Badge tone="neutral">Cargar compra (etapa 2)</Badge>}
          />
          <CardBody>
            <Table>
              <THead>
                <TR>
                  <TH>Fecha</TH>
                  <TH>PO</TH>
                  <TH>SKU</TH>
                  <TH>Proveedor</TH>
                  <TH className="text-right">Cant.</TH>
                  <TH className="text-right">Costo total</TH>
                  <TH className="text-right">Unitario</TH>
                  <TH>Nota</TH>
                </TR>
              </THead>
              <tbody>
                {purchasesInRange.map((p: StockPurchase) => {
                  const unit = p.qty > 0 ? p.totalCost / p.qty : 0;
                  const m = masterBySku.get(p.sku);
                  return (
                    <TR key={p.id}>
                      <TD className="text-muted">{p.date}</TD>
                      <TD className="font-medium">{p.id}</TD>
                      <TD className="font-medium">{p.sku}</TD>
                      <TD className="text-muted">{p.supplier}</TD>
                      <TD className="text-right">{compact(p.qty)}</TD>
                      <TD className="text-right">{ars(p.totalCost)}</TD>
                      <TD className="text-right">{ars(unit)}</TD>
                      <TD className="text-muted">{p.note ?? m?.model ?? ""}</TD>
                    </TR>
                  );
                })}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      ) : null}

      {/* WAC */}
      {view === "wac" ? (
        <Card>
          <CardHeader
            title="WAC (Costo promedio ponderado)"
            subtitle="Se calcula por SKU con base en compras históricas. Si no hay compras, usa fallback (demo)."
          />
          <CardBody>
            <Table>
              <THead>
                <TR>
                  <TH>SKU</TH>
                  <TH>Modelo</TH>
                  <TH className="text-right">Compras (u.)</TH>
                  <TH className="text-right">Compras ($)</TH>
                  <TH className="text-right">WAC</TH>
                  <TH>Última compra</TH>
                </TR>
              </THead>
              <tbody>
                {master.map((m) => {
                  const w = wacBySku.get(m.sku);
                  return (
                    <TR key={m.sku}>
                      <TD className="font-medium">{m.sku}</TD>
                      <TD className="text-muted">{m.model}</TD>
                      <TD className="text-right">{compact(w?.qty ?? 0)}</TD>
                      <TD className="text-right">{ars(w?.cost ?? 0)}</TD>
                      <TD className="text-right">{ars(w?.wac ?? 0)}</TD>
                      <TD className="text-muted">{w?.last ?? "-"}</TD>
                    </TR>
                  );
                })}
              </tbody>
            </Table>

            <div className="mt-3 rounded-2xl border border-border bg-panel2/30 p-3 text-sm text-muted">
              Referencia: WAC/AVCO es el método estándar para valuar inventario cuando hay compras a costos distintos.
            </div>
          </CardBody>
        </Card>
      ) : null}

      {/* MAESTRO */}
      {view === "maestro" ? (
        <Card>
          <CardHeader title="Stock maestro (SKU → MLAs)" subtitle="Tabla operativa para sincronización con Mercado Libre (etapa 2)." />
          <CardBody>
            <Table>
              <THead>
                <TR>
                  <TH>SKU</TH>
                  <TH>Modelo</TH>
                  <TH>Categoría</TH>
                  <TH className="text-right">Stock actual</TH>
                  <TH className="text-right">Disponible</TH>
                  <TH>MLAs</TH>
                  <TH className="text-right">Lead time</TH>
                </TR>
              </THead>
              <tbody>
                {valuationRows.map((r) => (
                  <TR key={r.sku}>
                    <TD className="font-medium">{r.sku}</TD>
                    <TD className="text-muted">{r.model}</TD>
                    <TD>
                      <Badge tone={r.category === "Celulares" ? "good" : r.category === "Accesorios" ? "neutral" : "warn"}>
                        {r.category}
                      </Badge>
                    </TD>
                    <TD className="text-right">{compact(r.onHand)}</TD>
                    <TD className="text-right">{compact(r.available)}</TD>
                    <TD className="text-muted">
                      {r.mlas.length ? r.mlas.join(", ") : <span className="text-muted">—</span>}
                    </TD>
                    <TD className="text-right">{r.category === "Digital" ? "—" : `${r.leadTimeDays} d`}</TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      ) : null}

      {/* VALORIZACIÓN */}
      {view === "valorizacion" ? (
        <Card>
          <CardHeader title="Valorización de inventario" subtitle="Capital inmovilizado, potencial de facturación y margen." />
          <CardBody>
            <Table>
              <THead>
                <TR>
                  <TH>SKU</TH>
                  <TH>Modelo</TH>
                  <TH className="text-right">Stock</TH>
                  <TH className="text-right">WAC</TH>
                  <TH className="text-right">Capital</TH>
                  <TH className="text-right">Precio est.</TH>
                  <TH className="text-right">Potencial</TH>
                  <TH className="text-right">Margen</TH>
                </TR>
              </THead>
              <tbody>
                {valuationRows.map((r) => (
                  <TR key={r.sku}>
                    <TD className="font-medium">{r.sku}</TD>
                    <TD className="text-muted">{r.model}</TD>
                    <TD className="text-right">{compact(r.onHand)}</TD>
                    <TD className="text-right">{ars(r.wac)}</TD>
                    <TD className="text-right">{ars(r.capital)}</TD>
                    <TD className="text-right">{ars(r.salePrice)}</TD>
                    <TD className="text-right">{ars(r.revenuePotential)}</TD>
                    <TD className="text-right">{ars(r.marginPotential)}</TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      ) : null}

      {/* PROYECCIÓN */}
      {view === "proyeccion" ? (
        <Card>
          <CardHeader
            title="Proyección y reposición"
            subtitle="Cobertura (días) + lead time + safety stock → reorder point y sugerido de compra."
          />
          <CardBody>
            <Table>
              <THead>
                <TR>
                  <TH>SKU</TH>
                  <TH>Modelo</TH>
                  <TH className="text-right">Stock</TH>
                  <TH className="text-right">Cobertura</TH>
                  <TH className="text-right">Lead</TH>
                  <TH className="text-right">Reorder</TH>
                  <TH className="text-right">Sugerido</TH>
                  <TH>Estado</TH>
                </TR>
              </THead>
              <tbody>
                {projectionRows.map((r) => (
                  <TR key={r.sku}>
                    <TD className="font-medium">{r.sku}</TD>
                    <TD className="text-muted">{r.model}</TD>
                    <TD className="text-right">{compact(r.onHand)}</TD>
                    <TD className="text-right">{r.coverageDays === 999 ? "—" : `${Math.round(r.coverageDays)} d`}</TD>
                    <TD className="text-right">{`${r.leadTimeDays} d`}</TD>
                    <TD className="text-right">{compact(Math.round(r.reorderPoint))}</TD>
                    <TD className="text-right">{compact(r.suggested)}</TD>
                    <TD>
                      {r.status === "Crítico" ? (
                        <Badge tone="bad">Crítico</Badge>
                      ) : r.status === "Riesgo" ? (
                        <Badge tone="warn">Riesgo</Badge>
                      ) : (
                        <Badge tone="good">OK</Badge>
                      )}
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>

            <div className="mt-3 rounded-2xl border border-border bg-panel2/30 p-3 text-sm text-muted">
              Etapa 2: “Sugerido” se genera con demanda real (ventas), tiempos reales de reposición y reglas por SKU.
            </div>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
