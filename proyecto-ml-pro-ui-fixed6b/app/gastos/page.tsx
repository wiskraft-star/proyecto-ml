"use client";

import { useMemo, useState } from "react";
import { expensesMock, expenseTxMock, salesMock, type ExpenseTx } from "@/lib/mock";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { Drawer } from "@/components/ui/drawer";
import { Modal } from "@/components/ui/modal";
import { ars, pct } from "@/lib/format";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ExpenseBars } from "@/components/dashboard/charts";
import { Plus, Search, SlidersHorizontal } from "lucide-react";

type BlockName = ExpenseTx["block"];

const BLOCK_ORDER: BlockName[] = [
  "Operativos",
  "Insumos",
  "Semi fijos",
  "Fijos",
  "Impuestos",
  "Devoluciones/Ajustes",
];

export default function GastosPage() {
  // UI-only / demo data
  const blocks = useMemo(() => expensesMock(), []);
  const tx = useMemo(() => expenseTxMock(), []);
  const sales = useMemo(() => salesMock(), []);

  // Filters
  const [month, setMonth] = useState("2025-12");
  const [block, setBlock] = useState<BlockName | "Todos">("Todos");
  const [q, setQ] = useState("");

  // UI state
  const [drawer, setDrawer] = useState<{ title: string; block?: BlockName } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const totalExpenses = blocks.reduce((a, b) => a + b.amount, 0);
  const grossSales = sales.reduce((a, s) => a + s.gross, 0);
  const netSales = sales.reduce((a, s) => a + s.net, 0);

  const variable = blocks
    .filter((b) => b.name === "Operativos" || b.name === "Devoluciones/Ajustes")
    .reduce((a, b) => a + b.amount, 0);

  const fixed = blocks
    .filter((b) => b.name === "Fijos" || b.name === "Semi fijos")
    .reduce((a, b) => a + b.amount, 0);

  const taxes = blocks.filter((b) => b.name === "Impuestos").reduce((a, b) => a + b.amount, 0);

  const ratioOverGross = grossSales > 0 ? totalExpenses / grossSales : 0;
  const ratioOverNet = netSales > 0 ? totalExpenses / netSales : 0;

  const filteredTx = tx
    .filter((t) => (block === "Todos" ? true : t.block === block))
    .filter((t) => {
      const hay = `${t.id} ${t.block} ${t.concept} ${t.ref ?? ""} ${t.note ?? ""}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  function openBlock(b: BlockName) {
    setDrawer({ title: `Bloque: ${b}`, block: b });
  }

  const blockExplainer: Record<BlockName, { what: string[]; calc: string[] }> = {
    "Operativos": {
      what: ["Embalaje por envío", "Mano de obra por orden", "Otros costos por preparación (si aplica)"],
      calc: ["En etapa 2: se calcula por venta (qty/orden) + reglas por SKU/categoría.", "Se audita por período y por canal."],
    },
    "Insumos": {
      what: ["Cinta, burbuja, bolsas, etiquetas", "Reposición de consumibles", "Herramientas menores"],
      calc: ["En etapa 2: carga por comprobante + prorrateo opcional por ventas del mes."],
    },
    "Semi fijos": {
      what: ["Factura ML del 20/21", "Contador", "Costos que crecen con operación"],
      calc: ["En etapa 2: importación desde facturas/servicios + reglas de imputación mensual."],
    },
    "Fijos": {
      what: ["Hosting, SaaS, licencias", "Costos de estructura"],
      calc: ["En etapa 2: suscripciones y costos recurrentes (mensual)."],
    },
    "Impuestos": {
      what: ["IVA a pagar", "IIBB a pagar", "Retenciones/percepciones (si aplica)"],
      calc: ["En etapa 2: cálculo por base imponible + retenciones detectadas + liquidación mensual."],
    },
    "Devoluciones/Ajustes": {
      what: ["Envío negativo en devoluciones", "Notas de crédito/débito", "Ajustes de plataforma"],
      calc: ["En etapa 2: detección automática cuando Mercado Pago muestra un movimiento negativo asociado al envío.", "Se vincula a orden/reclamo para auditoría."],
    },
  };

  return (
    <div className="space-y-6">
      {/* Header + Filters */}
      <Card>
        <CardHeader
          title="Gastos del mes"
          subtitle="Diseño completo (modo demo). En etapa 2 se conectan movimientos reales."
          right={<Badge tone="neutral">Total: {ars(totalExpenses)}</Badge>}
        />
        <CardBody>
          <div className="grid gap-3 md:grid-cols-12">
            <div className="md:col-span-3">
              <label className="mb-1 block text-xs text-muted">Mes</label>
              <Select value={month} onChange={(e) => setMonth(e.target.value)}>
                <option value="2025-12">Diciembre 2025</option>
                <option value="2025-11">Noviembre 2025</option>
                <option value="2025-10">Octubre 2025</option>
              </Select>
            </div>

            <div className="md:col-span-3">
              <label className="mb-1 block text-xs text-muted">Bloque</label>
              <Select value={block} onChange={(e) => setBlock(e.target.value as any)}>
                <option value="Todos">Todos</option>
                {BLOCK_ORDER.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </Select>
            </div>

            <div className="md:col-span-4">
              <label className="mb-1 block text-xs text-muted">Buscar</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  className="pl-9"
                  placeholder="Concepto, comprobante, nota…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
            </div>

            <div className="md:col-span-2 flex items-end justify-end gap-2">
              <Button variant="secondary" className="gap-2" onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Cargar gasto
              </Button>
              <Button variant="ghost" className="gap-2" onClick={() => setDrawer({ title: "Reglas & Auditoría" })}>
                <SlidersHorizontal className="h-4 w-4" />
                Reglas
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* KPIs */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total gastos"
          value={totalExpenses}
          deltaPct={0.028}
          tone="neutral"
          hint="Suma de bloques del mes (demo)."
        />
        <KpiCard
          label="Variables (operativos + devoluciones)"
          value={variable}
          deltaPct={0.041}
          tone="warn"
          hint="Impacta directo sobre margen por venta."
        />
        <KpiCard
          label="Fijos + semi fijos"
          value={fixed}
          deltaPct={0.006}
          tone="neutral"
          hint="Estructura mensual."
        />
        <KpiCard
          label="Impuestos"
          value={taxes}
          deltaPct={-0.012}
          tone="neutral"
          hint="IVA / IIBB (demo)."
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-4">
          <ExpenseBars blocks={blocks} />

          <Card>
            <CardHeader
              title="Transacciones de gasto"
              subtitle="Detalle auditable (modo demo). Click para ver detalle por bloque."
              right={<Badge tone="neutral">{filteredTx.length} registros</Badge>}
            />
            <CardBody>
              <Table>
                <THead>
                  <TR className="border-t-0">
                    <TH>Fecha</TH>
                    <TH>Bloque</TH>
                    <TH>Concepto</TH>
                    <TH>Comprobante</TH>
                    <TH className="text-right">Monto</TH>
                  </TR>
                </THead>

                <tbody>
                  {filteredTx.map((t) => (
                    <TR key={t.id} className="hover:bg-panel2/30 cursor-pointer" onClick={() => openBlock(t.block)}>
                      <TD>{t.date}</TD>
                      <TD>
                        <Badge tone={t.block === "Impuestos" ? "warn" : t.block === "Devoluciones/Ajustes" ? "bad" : "neutral"}>
                          {t.block}
                        </Badge>
                      </TD>
                      <TD className="font-medium">{t.concept}</TD>
                      <TD className="font-mono text-xs text-muted">{t.ref ?? "—"}</TD>
                      <TD className="text-right font-semibold">{ars(t.amount)}</TD>
                    </TR>
                  ))}
                </tbody>
              </Table>

              <div className="mt-3 rounded-2xl border border-border bg-panel2/30 p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-muted">
                    Ratios (demo): gastos / bruto <span className="text-text font-medium">{pct(ratioOverGross)}</span> · gastos / neto{" "}
                    <span className="text-text font-medium">{pct(ratioOverNet)}</span>
                  </div>
                  <div className="text-muted">
                    Objetivo sugerido: mantener gastos totales por debajo de <span className="text-text font-medium">X%</span> del bruto.
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader title="Bloques (lectura rápida)" subtitle="Click para abrir auditoría del bloque." />
            <CardBody className="space-y-3">
              {BLOCK_ORDER.map((b) => {
                const found = blocks.find((x) => x.name === b);
                const amount = found?.amount ?? 0;
                const tone =
                  b === "Devoluciones/Ajustes" ? "bad" : b === "Impuestos" ? "warn" : b === "Operativos" ? "warn" : "neutral";

                return (
                  <button
                    key={b}
                    onClick={() => openBlock(b)}
                    className="w-full rounded-2xl border border-border bg-panel2/30 p-4 text-left hover:bg-panel2/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">{b}</div>
                        <div className="mt-1 text-sm text-muted">{found?.note ?? "—"}</div>
                      </div>
                      <Badge tone={tone}>{ars(amount)}</Badge>
                    </div>
                  </button>
                );
              })}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Notas de diseño" subtitle="Qué va en la etapa 2 (sin tocarlo ahora)." />
            <CardBody className="space-y-2 text-sm text-muted">
              <div>• Detectar “envío negativo” cuando Mercado Pago muestre movimiento negativo asociado a devolución.</div>
              <div>• Distinguir costos: variables por venta vs fijos mensuales, sin mezclar en el mismo KPI.</div>
              <div>• Auditoría: cada gasto debe poder rastrearse a comprobante/orden/bloque.</div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Drawer (block audit) */}
      <Drawer
        open={!!drawer}
        onClose={() => setDrawer(null)}
        title={drawer?.title ?? ""}
        width="max-w-2xl"
      >
        {drawer?.block ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-panel2/30 p-4">
              <div className="text-sm font-semibold">Qué incluye</div>
              <ul className="mt-2 list-disc pl-5 text-sm text-muted">
                {blockExplainer[drawer.block].what.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>

              <div className="mt-4 text-sm font-semibold">Cómo se calcula</div>
              <ul className="mt-2 list-disc pl-5 text-sm text-muted">
                {blockExplainer[drawer.block].calc.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>

            <Card>
              <CardHeader
                title="Detalle (demo)"
                subtitle="Transacciones de este bloque (UI)."
                right={<Badge tone="neutral">{drawer.block}</Badge>}
              />
              <CardBody>
                <Table>
                  <THead>
                    <TR className="border-t-0">
                      <TH>Fecha</TH>
                      <TH>Concepto</TH>
                      <TH>Comprobante</TH>
                      <TH className="text-right">Monto</TH>
                    </TR>
                  </THead>
                  <tbody>
                    {tx
                      .filter((t) => t.block === drawer.block)
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((t) => (
                        <TR key={`d-${t.id}`}>
                          <TD>{t.date}</TD>
                          <TD className="font-medium">{t.concept}</TD>
                          <TD className="font-mono text-xs text-muted">{t.ref ?? "—"}</TD>
                          <TD className="text-right font-semibold">{ars(t.amount)}</TD>
                        </TR>
                      ))}
                  </tbody>
                </Table>
              </CardBody>
            </Card>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-2xl border border-border bg-panel2/30 p-4 text-sm text-muted">
              Este panel se usa para documentar reglas de imputación y auditoría. En esta etapa es solo UI.
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-panel2/30 p-4">
                <div className="text-sm font-semibold">Reglas por bloque</div>
                <div className="mt-2 text-sm text-muted">Cómo se decide qué entra en cada bloque.</div>
              </div>
              <div className="rounded-2xl border border-border bg-panel2/30 p-4">
                <div className="text-sm font-semibold">Auditoría</div>
                <div className="mt-2 text-sm text-muted">Cómo rastrear un número hasta el comprobante/orden.</div>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Modal: create expense (UI only) */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Cargar gasto (UI)">
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-muted">Bloque</label>
              <Select defaultValue="Operativos">
                {BLOCK_ORDER.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Fecha</label>
              <Input type="date" defaultValue="2025-12-13" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted">Concepto</label>
            <Input placeholder="Ej: Cinta, burbuja, contador, IVA…" />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-muted">Monto (ARS)</label>
              <Input type="number" placeholder="0" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Comprobante</label>
              <Input placeholder="FC / Ticket / NC" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted">Nota</label>
            <Input placeholder="Opcional" />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={() => setModalOpen(false)}>
              Guardar (UI)
            </Button>
          </div>

          <div className="text-xs text-muted">
            Nota: esto no guarda en ningún lado todavía. Es solo diseño para definir el flujo.
          </div>
        </div>
      </Modal>
    </div>
  );
}
