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
import { ars, compact, dateEs, pct } from "@/lib/format";
import { catalogBuyBoxMock, type CatalogBuyBoxRow, type BuyBoxStatus, type CatalogCompetitorOffer } from "@/lib/mock";

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
  { label: "Mismo período (mes anterior)", value: "prev_month" },
  { label: "No comparar", value: "none" },
  { label: "Personalizado", value: "custom" },
] as const;

type ViewMode = "ambos" | "sin_cuotas" | "con_cuotas";

function parseDate(s: string) {
  const [y, m, d] = s.split("-").map((n) => Number(n));
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function statusTone(s: BuyBoxStatus): "good" | "warn" | "bad" | "neutral" {
  if (s === "Ganando") return "good";
  if (s === "Compitiendo") return "warn";
  if (s === "Perdiendo") return "bad";
  return "neutral";
}

function recommend(r: CatalogBuyBoxRow) {
  const cash = r.gapCash;
  const cuotas = r.gapCuotas;
  // Regla simple UI: priorizar el canal con mayor pérdida.
  if (cash > 0 && cuotas > 0) return "Bajar precio (prioridad canal peor) o revisar margen mínimo";
  if (cash > 0 && cuotas <= 0) return "Ajustar sin cuotas (defender ranking cash)";
  if (cuotas > 0 && cash <= 0) return "Ajustar con cuotas (competencia en financiación)";
  if (cash === 0 && cuotas === 0) return "Mantener (ganando ambos)";
  if (cash === 0 && cuotas < 0) return "Mantener cash; evaluar subir cuotas para margen";
  if (cuotas === 0 && cash < 0) return "Mantener cuotas; evaluar subir cash para margen";
  return "Mantener / monitorear";
}

export default function CatalogoPage() {
  // UI-only. En etapa de conexión: /items/{id}/price_to_win + notificaciones.
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

  const [q, setQ] = useState("");
  const [view, setView] = useState<ViewMode>("ambos");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<CatalogBuyBoxRow | null>(null);

  const data = useMemo(() => catalogBuyBoxMock(), []);

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

  const subtitle = useMemo(() => {
    const base = `${dateEs(rangeFrom)} → ${dateEs(rangeTo)}`;
    if (compare === "none") return base;
    if (compare === "custom") return `${base} · Comparando ${compareFrom} → ${compareTo}`;
    return `${base} · Comparando vs ${compare === "prev" ? "período anterior" : "mes anterior"}`;
  }, [rangeFrom, rangeTo, compare, compareFrom, compareTo]);

  const rows = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return data.rows
      .filter((r) => {
        if (!qq) return true;
        return (
          r.title.toLowerCase().includes(qq) ||
          r.sku.toLowerCase().includes(qq) ||
          r.ourItemId.toLowerCase().includes(qq) ||
          r.catalogProductId.toLowerCase().includes(qq)
        );
      })
      .sort((a, b) => (a.statusCash === "Perdiendo" ? -1 : 1) - (b.statusCash === "Perdiendo" ? -1 : 1));
  }, [data.rows, q]);

  const kpis = useMemo(() => {
    const total = rows.length;
    const winCash = rows.filter((r) => r.statusCash === "Ganando").length;
    const winCuotas = rows.filter((r) => r.statusCuotas === "Ganando").length;
    const losingAny = rows.filter((r) => r.statusCash === "Perdiendo" || r.statusCuotas === "Perdiendo").length;

    const avgGapCash = total ? rows.reduce((s, r) => s + Math.max(0, r.gapCash), 0) / total : 0;
    const avgGapCuotas = total ? rows.reduce((s, r) => s + Math.max(0, r.gapCuotas), 0) / total : 0;

    const winRateCash = total ? winCash / total : 0;
    const winRateCuotas = total ? winCuotas / total : 0;

    return {
      total,
      losingAny,
      avgGapCash,
      avgGapCuotas,
      winRateCash,
      winRateCuotas,
    };
  }, [rows]);

  const visibleCols = useMemo(() => {
    if (view === "sin_cuotas") return "cash";
    if (view === "con_cuotas") return "cuotas";
    return "both";
  }, [view]);

  const offers = useMemo(() => {
    if (!selected) return [] as CatalogCompetitorOffer[];
    return data.offers.filter((o) => o.catalogProductId === selected.catalogProductId);
  }, [data.offers, selected]);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Catálogo / Buy Box"
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
                className="h-9 w-[190px]"
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

              <Select className="h-9 w-[160px]" value={view} onChange={(e) => setView(e.target.value as ViewMode)}>
                <option value="ambos">Vista: Ambos</option>
                <option value="sin_cuotas">Vista: Sin cuotas</option>
                <option value="con_cuotas">Vista: Con cuotas</option>
              </Select>

              <Button variant="outline" className="h-9">
                Refrescar
              </Button>
            </div>
          }
        />
        <CardBody className="grid gap-3 md:grid-cols-5">
          <KpiCard title="Catálogos monitoreados" value={String(kpis.total)} hint="Cantidad de catalog_product_id con oferta propia." />
          <KpiCard
            title="Perdiendo (al menos un canal)"
            value={String(kpis.losingAny)}
            tone={kpis.losingAny ? "bad" : "good"}
            hint="Perdiendo en sin cuotas o con cuotas."
          />
          <KpiCard
            title="Win rate sin cuotas"
            value={pct(kpis.winRateCash)}
            tone={kpis.winRateCash >= 0.8 ? "good" : kpis.winRateCash >= 0.6 ? "warn" : "bad"}
            hint="Proporción ganando el catálogo en cash."
          />
          <KpiCard
            title="Win rate con cuotas"
            value={pct(kpis.winRateCuotas)}
            tone={kpis.winRateCuotas >= 0.8 ? "good" : kpis.winRateCuotas >= 0.6 ? "warn" : "bad"}
            hint="Proporción ganando el catálogo en financiación."
          />
          <KpiCard
            title="Brecha promedio para ganar"
            value={`${ars(Math.round(visibleCols === "cuotas" ? kpis.avgGapCuotas : kpis.avgGapCash))}`}
            tone={(visibleCols === "cuotas" ? kpis.avgGapCuotas : kpis.avgGapCash) > 0 ? "warn" : "good"}
            hint="Promedio de (tu precio - price_to_win)."
          />
        </CardBody>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader
              title="Competencia por catálogo"
              subtitle="Estado por canal (sin cuotas / con cuotas) + price-to-win. Click para detalle."
              right={<Input className="h-9 w-[260px]" placeholder="Buscar SKU / item / catálogo…" value={q} onChange={(e) => setQ(e.target.value)} />}
            />
            <CardBody className="p-0">
              <Table>
                <THead>
                  <TR>
                    <TH>Producto</TH>
                    <TH>SKU</TH>
                    {visibleCols !== "cuotas" ? (
                      <>
                        <TH>Sin cuotas</TH>
                        <TH className="text-right">Brecha</TH>
                        <TH className="text-right">Price-to-win</TH>
                      </>
                    ) : null}
                    {visibleCols !== "cash" ? (
                      <>
                        <TH>Con cuotas</TH>
                        <TH className="text-right">Brecha</TH>
                        <TH className="text-right">Price-to-win</TH>
                      </>
                    ) : null}
                    <TH>Acción sugerida</TH>
                    <TH className="text-right">Actualizado</TH>
                  </TR>
                </THead>
                <tbody>
                  {rows.map((r) => (
                    <TR
                      key={r.catalogProductId}
                      className="cursor-pointer hover:bg-panel2/50"
                      onClick={() => {
                        setSelected(r);
                        setDrawerOpen(true);
                      }}
                    >
                      <TD>
                        <div className="font-medium">{r.title}</div>
                        <div className="mt-0.5 text-xs text-muted">
                          {r.catalogProductId} · {r.ourItemId}
                        </div>
                      </TD>
                      <TD className="text-sm">{r.sku}</TD>

                      {visibleCols !== "cuotas" ? (
                        <>
                          <TD>
                            <Badge tone={statusTone(r.statusCash)}>{r.statusCash}</Badge>
                            <div className="mt-1 text-xs text-muted">{ars(r.priceCash)}</div>
                          </TD>
                          <TD className="text-right">
                            <div className={r.gapCash > 0 ? "text-bad font-semibold" : "text-muted"}>
                              {r.gapCash > 0 ? `+${ars(r.gapCash)}` : r.gapCash === 0 ? "0" : `-${ars(Math.abs(r.gapCash))}`}
                            </div>
                          </TD>
                          <TD className="text-right">{ars(r.priceToWinCash)}</TD>
                        </>
                      ) : null}

                      {visibleCols !== "cash" ? (
                        <>
                          <TD>
                            <Badge tone={statusTone(r.statusCuotas)}>{r.statusCuotas}</Badge>
                            <div className="mt-1 text-xs text-muted">{ars(r.priceCuotas)}</div>
                          </TD>
                          <TD className="text-right">
                            <div className={r.gapCuotas > 0 ? "text-bad font-semibold" : "text-muted"}>
                              {r.gapCuotas > 0 ? `+${ars(r.gapCuotas)}` : r.gapCuotas === 0 ? "0" : `-${ars(Math.abs(r.gapCuotas))}`}
                            </div>
                          </TD>
                          <TD className="text-right">{ars(r.priceToWinCuotas)}</TD>
                        </>
                      ) : null}

                      <TD className="text-sm text-muted">{recommend(r)}</TD>
                      <TD className="text-right text-sm text-muted">{r.updatedAt}</TD>
                    </TR>
                  ))}
                </tbody>
              </Table>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Reglas de automatización (propuesta)" subtitle="Estas reglas guían el motor de precio. UI-only por ahora." />
            <CardBody className="space-y-3 text-sm text-muted">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-panel2/60 p-4">
                  <div className="font-semibold text-text">Defender Buy Box (sin cuotas)</div>
                  <div className="mt-1">Si gap cash ≤ {ars(1500)} y margen ≥ mínimo → ajustar fino (paso chico).</div>
                </div>
                <div className="rounded-2xl border border-border bg-panel2/60 p-4">
                  <div className="font-semibold text-text">Defender Buy Box (con cuotas)</div>
                  <div className="mt-1">Si gap cuotas ≤ {ars(2000)} → ajustar solo en modo cuotas.</div>
                </div>
                <div className="rounded-2xl border border-border bg-panel2/60 p-4">
                  <div className="font-semibold text-text">No competir (protección margen)</div>
                  <div className="mt-1">Si price-to-win rompe margen mínimo → marcar “No competir” y pausar ajuste.</div>
                </div>
                <div className="rounded-2xl border border-border bg-panel2/60 p-4">
                  <div className="font-semibold text-text">Alertas por volatilidad</div>
                  <div className="mt-1">Si price-to-win cambia más de 3 veces/día → notificar y congelar reglas 2h.</div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Impacto estimado" subtitle="Lectura rápida (pro/operativa)." />
            <CardBody className="space-y-3">
              <div className="rounded-2xl border border-border bg-panel2/60 p-4">
                <div className="text-xs text-muted">Riesgo de visibilidad</div>
                <div className="mt-1 text-lg font-semibold">{compact(kpis.losingAny)} catálogos</div>
                <div className="mt-1 text-sm text-muted">Perdiendo en al menos un canal (cash/cuotas).</div>
              </div>
              <div className="rounded-2xl border border-border bg-panel2/60 p-4">
                <div className="text-xs text-muted">Brecha promedio (cash)</div>
                <div className="mt-1 text-lg font-semibold">{ars(Math.round(kpis.avgGapCash))}</div>
                <div className="mt-1 text-sm text-muted">Para recuperar Buy Box sin cuotas.</div>
              </div>
              <div className="rounded-2xl border border-border bg-panel2/60 p-4">
                <div className="text-xs text-muted">Brecha promedio (cuotas)</div>
                <div className="mt-1 text-lg font-semibold">{ars(Math.round(kpis.avgGapCuotas))}</div>
                <div className="mt-1 text-sm text-muted">Para recuperar Buy Box con cuotas.</div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="API (etapa 2)" subtitle="Qué endpoints vamos a consumir para poblar esto." />
            <CardBody className="space-y-2 text-sm text-muted">
              <div className="rounded-xl border border-border bg-panel2/60 px-3 py-2">
                <div className="font-semibold text-text">Price-to-win</div>
                <div className="mt-1 font-mono text-xs">GET /items/{"{item_id}"}/price_to_win?version=v2</div>
              </div>
              <div className="rounded-xl border border-border bg-panel2/60 px-3 py-2">
                <div className="font-semibold text-text">Notificaciones</div>
                <div className="mt-1 text-xs">marketplace_item_competition / catalog_suggestions → recalcular</div>
              </div>
              <div className="rounded-xl border border-border bg-panel2/60 px-3 py-2">
                <div className="font-semibold text-text">Catálogo</div>
                <div className="mt-1 text-xs">Detectar catalog_product_id en items y agrupar por catálogo</div>
              </div>
              <div className="rounded-xl border border-border bg-panel2/60 px-3 py-2">
                <div className="font-semibold text-text">Acción (precio)</div>
                <div className="mt-1 text-xs">PUT /items/{"{item_id}"} (precio) con guardrails de margen</div>
              </div>
              <div className="pt-2">
                <Button variant="outline" className="w-full">
                  Ver checklist de integración
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selected ? `Detalle · ${selected.sku}` : "Detalle"}
      >
        {!selected ? null : (
          <div className="space-y-4">
            <div>
              <div className="text-sm font-semibold">{selected.title}</div>
              <div className="mt-1 text-xs text-muted">
                {selected.catalogProductId} · Tu ítem: {selected.ourItemId}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-panel2/60 p-4">
                <div className="text-xs text-muted">Sin cuotas</div>
                <div className="mt-1 flex items-center gap-2">
                  <Badge tone={statusTone(selected.statusCash)}>{selected.statusCash}</Badge>
                  <div className="text-sm text-muted">
                    Tu precio: <span className="font-semibold text-text">{ars(selected.priceCash)}</span>
                  </div>
                </div>
                <div className="mt-2 text-sm text-muted">
                  Price-to-win: <span className="font-semibold text-text">{ars(selected.priceToWinCash)}</span> · Brecha{" "}
                  <span className={selected.gapCash > 0 ? "font-semibold text-bad" : "font-semibold text-good"}>
                    {selected.gapCash > 0 ? `+${ars(selected.gapCash)}` : selected.gapCash === 0 ? "0" : `-${ars(Math.abs(selected.gapCash))}`}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-panel2/60 p-4">
                <div className="text-xs text-muted">Con cuotas</div>
                <div className="mt-1 flex items-center gap-2">
                  <Badge tone={statusTone(selected.statusCuotas)}>{selected.statusCuotas}</Badge>
                  <div className="text-sm text-muted">
                    Tu precio: <span className="font-semibold text-text">{ars(selected.priceCuotas)}</span>
                  </div>
                </div>
                <div className="mt-2 text-sm text-muted">
                  Price-to-win: <span className="font-semibold text-text">{ars(selected.priceToWinCuotas)}</span> · Brecha{" "}
                  <span className={selected.gapCuotas > 0 ? "font-semibold text-bad" : "font-semibold text-good"}>
                    {selected.gapCuotas > 0 ? `+${ars(selected.gapCuotas)}` : selected.gapCuotas === 0 ? "0" : `-${ars(Math.abs(selected.gapCuotas))}`}
                  </span>
                </div>
              </div>
            </div>

            <Card>
              <CardHeader title="Ofertas (mock)" subtitle="Competidores y estructura (precio / cuotas / envío / ETA / reputación)." />
              <CardBody className="p-0">
                <Table>
                  <THead>
                    <TR>
                      <TH>Vendedor</TH>
                      <TH>Precio</TH>
                      <TH>Cuotas</TH>
                      <TH>Envío</TH>
                      <TH className="text-right">ETA</TH>
                      <TH>Rep</TH>
                      <TH className="text-right">Winner</TH>
                    </TR>
                  </THead>
                  <tbody>
                    {offers.map((o, idx) => (
                      <TR key={idx}>
                        <TD className="text-sm">{o.seller}</TD>
                        <TD className="text-sm">{ars(o.price)}</TD>
                        <TD className="text-sm">{o.cuotas ? "Sí" : "No"}</TD>
                        <TD className="text-sm">{o.shipping}</TD>
                        <TD className="text-right text-sm">{o.etaDays}d</TD>
                        <TD className="text-sm">
                          <Badge tone={o.rep === "Yellow" ? "warn" : o.rep === "Green" ? "neutral" : "good"}>{o.rep}</Badge>
                        </TD>
                        <TD className="text-right">{o.winner ? <Badge tone="good">Sí</Badge> : <Badge tone="neutral">—</Badge>}</TD>
                      </TR>
                    ))}
                  </tbody>
                </Table>
              </CardBody>
            </Card>

            <div className="flex gap-2">
              <Button className="flex-1">Simular ajuste</Button>
              <Button variant="outline" className="flex-1">
                Registrar regla
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      <Modal open={customOpen} onClose={() => setCustomOpen(false)} title="Rango personalizado">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <div className="mb-1 text-sm font-medium">Desde</div>
            <Input value={tmpFrom} onChange={(e) => setTmpFrom(e.target.value)} placeholder="YYYY-MM-DD" />
          </div>
          <div>
            <div className="mb-1 text-sm font-medium">Hasta</div>
            <Input value={tmpTo} onChange={(e) => setTmpTo(e.target.value)} placeholder="YYYY-MM-DD" />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setCustomOpen(false)}>
            Cancelar
          </Button>
          <Button
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

      <Modal open={compareOpen} onClose={() => setCompareOpen(false)} title="Comparación personalizada">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <div className="mb-1 text-sm font-medium">Desde</div>
            <Input value={compareFrom} onChange={(e) => setCompareFrom(e.target.value)} placeholder="YYYY-MM-DD" />
          </div>
          <div>
            <div className="mb-1 text-sm font-medium">Hasta</div>
            <Input value={compareTo} onChange={(e) => setCompareTo(e.target.value)} placeholder="YYYY-MM-DD" />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setCompareOpen(false)}>
            Cancelar
          </Button>
          <Button
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
