import { addDays, formatISO } from "./time";

export type Kpi = {
  key: string;
  label: string;
  value: number;
  deltaPct?: number; // vs prev period
  tone?: "neutral" | "good" | "warn" | "bad";
  hint?: string;
};

export type ActionItem = {
  id: string;
  title: string;
  detail: string;
  tone: "good" | "warn" | "bad" | "neutral";
  cta: string;
};

export type SaleRow = {
  orderId: string;
  date: string; // YYYY-MM-DD
  sku: string;
  title: string;
  qty: number;
  gross: number;
  fees: number;
  shipping: number;
  ads: number;
  refunds: number;
  net: number;
  status: "Entregado" | "Cancelado" | "Devuelto" | "En camino";
};

export type ExpenseBlock = { name: string; amount: number; note: string; };


export type ExpenseTx = {
  id: string;
  date: string; // YYYY-MM-DD
  block: "Operativos" | "Insumos" | "Semi fijos" | "Fijos" | "Impuestos" | "Devoluciones/Ajustes";
  concept: string;
  amount: number; // positivo = gasto, negativo = ajuste a favor
  ref?: string;
  note?: string;
};
export type PnLLine = { label: string; amount: number; kind: "pos" | "neg" | "total"; };

export type StockRow = {
  sku: string;
  title: string;
  onHand: number;
  available: number;
  committed: number;
  daysCover: number;
  value: number;
  velocity: "Alta" | "Media" | "Baja";
};

export function dashboardMock() {
  const kpis: Kpi[] = [
    { key: "gmv", label: "Facturación (mes)", value: 128_450_000, deltaPct: 0.08, tone: "neutral", hint: "Bruta (sin descuentos)." },
    { key: "net", label: "Ganancia neta", value: 24_920_000, deltaPct: 0.05, tone: "good", hint: "Después de comisiones, envíos, ads, devoluciones, costos internos e impuestos (modo actual)." },
    { key: "margin", label: "Margen neto", value: 0.194, deltaPct: -0.01, tone: "warn", hint: "Porcentaje neto sobre facturación." },
    { key: "orders", label: "Pedidos", value: 864, deltaPct: 0.11, tone: "neutral", hint: "Órdenes del período." },
    { key: "ads", label: "Publicidad", value: 8_640_000, deltaPct: 0.14, tone: "warn", hint: "Gasto en ads (real o estimado según integración)." },
    { key: "returns", label: "Costo devoluciones", value: 2_310_000, deltaPct: 0.22, tone: "bad", hint: "Incluye 'envío negativo' + ajustes." },
    { key: "risk", label: "Stock en riesgo", value: 12, deltaPct: 0.0, tone: "warn", hint: "SKUs con cobertura < 7 días." },
    { key: "rep", label: "Reputación", value: 1, deltaPct: 0.0, tone: "good", hint: "Semáforo interno (1=OK, 2=Atención, 3=Crítico)." },
  ];

  const actions: ActionItem[] = [
    { id: "a1", title: "12 SKUs en stock crítico", detail: "Cobertura promedio: 4.3 días. Riesgo de quiebre esta semana.", tone: "bad", cta: "Ver reposición" },
    { id: "a2", title: "ACOS alto en 3 campañas", detail: "Publicidad está drenando margen por encima del objetivo.", tone: "warn", cta: "Revisar ads" },
    { id: "a3", title: "5 ventas con margen neto < 10%", detail: "Posible precio bajo o costo mal cargado.", tone: "warn", cta: "Auditar ventas" },
    { id: "a4", title: "2 reclamos nuevos", detail: "Impacto potencial en reputación si no se atienden hoy.", tone: "bad", cta: "Abrir postventa" },
    { id: "a5", title: "Buybox: 4 publicaciones perdiendo", detail: "Diferencia de precio y/o envío afecta ranking.", tone: "neutral", cta: "Ver publicaciones" },
  ];

  // charts
  const start = new Date(Date.UTC(2025, 11, 1)); // Dec 2025
  const series = Array.from({ length: 14 }).map((_, i) => {
    const d = addDays(start, i);
    const day = i + 1;
    const sales = 7_500_000 + Math.round(1_200_000 * Math.sin(i / 2)) + (i * 120_000);
    const costs = 5_900_000 + Math.round(900_000 * Math.cos(i / 2.2)) + (i * 90_000);
    const net = Math.max(0, sales - costs - 420_000);
    return { date: formatISO(d), sales, costs, net };
  });

  const expenseBlocks: ExpenseBlock[] = [
    { name: "Comisiones ML", amount: 18_420_000, note: "Cargos por venta" },
    { name: "Envíos", amount: 14_090_000, note: "Costo neto de logística" },
    { name: "Publicidad", amount: 8_640_000, note: "Ads (ACOS promedio 6.7%)" },
    { name: "Devoluciones", amount: 2_310_000, note: "Incluye envío negativo" },
    { name: "Costos internos", amount: 3_050_000, note: "MO + embalaje + insumos variables" },
    { name: "Fijos", amount: 4_780_000, note: "SaaS + sueldos + contador" },
  ];

  return { kpis, actions, series, expenseBlocks };
}

export function salesMock(): SaleRow[] {
  const base: SaleRow[] = [
    {
      orderId: "2000010200016693",
      date: "2025-12-12",
      sku: "REDMI14C-256",
      title: "Xiaomi Redmi 14C 256GB",
      qty: 1,
      gross: 308_971,
      fees: 44_801,
      shipping: 28_400,
      ads: 12_500,
      refunds: 0,
      net: 223_270,
      status: "Entregado",
    },
    {
      orderId: "2000010194403901",
      date: "2025-12-12",
      sku: "DIGI-25",
      title: "Tarjeta digital 25 USD",
      qty: 1,
      gross: 39_990,
      fees: 6_198,
      shipping: 0,
      ads: 1_100,
      refunds: 0,
      net: 32_692,
      status: "Entregado",
    },
    {
      orderId: "2000010171546565",
      date: "2025-12-11",
      sku: "ACC-AURIC",
      title: "Auriculares In-Ear",
      qty: 1,
      gross: 24_999,
      fees: 3_625,
      shipping: 0,
      ads: 875,
      refunds: 0,
      net: 20_499,
      status: "En camino",
    },
    {
      orderId: "2000010135617651",
      date: "2025-12-10",
      sku: "DIGI-5",
      title: "Tarjeta digital 5 USD",
      qty: 1,
      gross: 18_500,
      fees: 2_868,
      shipping: 0,
      ads: 950,
      refunds: 0,
      net: 14_682,
      status: "Entregado",
    },
  ];

  // Expand a bit
  const extra: SaleRow[] = Array.from({ length: 20 }).map((_, i) => {
    const day = 2 + (i % 10);
    const date = `2025-12-${String(day).padStart(2, "0")}`;

    // Demo: 2 líneas de negocio (Físico + Digital)
    const isDigital = i % 3 === 0;
    const sku = isDigital
      ? (i % 2 ? "DIGI-5" : "DIGI-25")
      : (i % 2 ? "REDMI14C-256" : "ACC-AURIC");

    const title = sku.startsWith("DIGI")
      ? `Tarjeta digital ${sku === "DIGI-25" ? "25 USD" : "5 USD"}`
      : sku === "ACC-AURIC"
      ? "Auriculares In-Ear"
      : "Xiaomi Redmi 14C 256GB";

    const qty = 1;
    const gross =
      sku === "DIGI-25" ? 39_990 :
      sku === "DIGI-5" ? 18_500 :
      sku === "ACC-AURIC" ? 24_999 :
      308_971;

    const fees = Math.round(gross * (isDigital ? 0.155 : 0.145));
    const ads = isDigital ? Math.round(gross * 0.05) : Math.round(gross * 0.035);
    const shipping = sku.startsWith("REDMI") ? 28_400 : 0;

    // Simular devolución: reintegro + costo de "envío negativo"
    const refundsBase = (i % 13 === 0) ? Math.round(gross * 0.95) : 0;
    const shippingNeg = refundsBase ? shipping : 0;

    const net = Math.max(0, gross - fees - ads - shipping - refundsBase - shippingNeg);
    const status: SaleRow["status"] = refundsBase ? "Devuelto" : (i % 7 === 0 ? "En camino" : "Entregado");

    return {
      orderId: `2000010${200000000 + i}`,
      date,
      sku,
      title,
      qty,
      gross,
      fees,
      shipping,
      ads,
      refunds: refundsBase + shippingNeg,
      net,
      status,
    };
  });

  return [...base, ...extra].sort((a, b) => b.date.localeCompare(a.date));
}

export function pnlMock(): PnLLine[] {
  return [
    { label: "Ventas brutas", amount: 128_450_000, kind: "pos" },
    { label: "Comisiones ML", amount: -18_420_000, kind: "neg" },
    { label: "Envíos", amount: -14_090_000, kind: "neg" },
    { label: "Publicidad", amount: -8_640_000, kind: "neg" },
    { label: "Devoluciones (incl. envío negativo)", amount: -2_310_000, kind: "neg" },
    { label: "Costos internos (MO + embalaje + insumos)", amount: -3_050_000, kind: "neg" },
    { label: "Costos fijos", amount: -4_780_000, kind: "neg" },
    { label: "Impuestos (modo actual)", amount: -2_240_000, kind: "neg" },
    { label: "Resultado neto", amount: 24_920_000, kind: "total" },
  ];
}

export function expenseTxMock(): ExpenseTx[] {
  return [
    // 1) Operativos (por venta)
    { id: "op-1", date: "2025-12-02", block: "Operativos", concept: "Embalaje (promedio)", amount: 200 * 120, note: "c/u × envíos despachados (demo)" },
    { id: "op-2", date: "2025-12-02", block: "Operativos", concept: "Mano de obra (packing)", amount: 400 * 120, note: "c/u × envíos despachados (demo)" },

    // 2) Insumos del mes
    { id: "ins-1", date: "2025-12-05", block: "Insumos", concept: "Cinta + film + burbuja", amount: 95_150, ref: "TICKET-001" },
    { id: "ins-2", date: "2025-12-07", block: "Insumos", concept: "Bolsas + etiquetas", amount: 41_800, ref: "TICKET-002" },

    // 3) Semi fijos (administración que escala)
    { id: "sf-1", date: "2025-12-20", block: "Semi fijos", concept: "Factura ML 20/21", amount: 2_000_000, note: "cargo mensual (demo)" },
    { id: "sf-2", date: "2025-12-01", block: "Semi fijos", concept: "Contador", amount: 380_000, note: "honorarios" },

    // 4) Fijos (estructura)
    { id: "fx-1", date: "2025-12-01", block: "Fijos", concept: "Hosting / dominio", amount: 12_999 },
    { id: "fx-2", date: "2025-12-01", block: "Fijos", concept: "Nubimetrics", amount: 39_999 },
    { id: "fx-3", date: "2025-12-01", block: "Fijos", concept: "ChatGPT", amount: 20_999 },

    // 5) Impuestos
    { id: "tax-1", date: "2025-12-10", block: "Impuestos", concept: "IVA a pagar (estimado)", amount: 450_000, note: "demo" },
    { id: "tax-2", date: "2025-12-10", block: "Impuestos", concept: "IIBB a pagar (estimado)", amount: 180_000, note: "demo" },

    // 6) Devoluciones / ajustes
    { id: "ret-1", date: "2025-12-11", block: "Devoluciones/Ajustes", concept: "Envío negativo devolución", amount: 28_400, note: "cuando MP muestra cargo negativo (demo)" },
    { id: "adj-1", date: "2025-12-12", block: "Devoluciones/Ajustes", concept: "Nota de crédito ML", amount: -72_000, ref: "NC-ML-0001" },
  ];
}

export function expensesMock(): ExpenseBlock[] {
  const tx = expenseTxMock();
  const order: ExpenseTx["block"][] = ["Operativos", "Insumos", "Semi fijos", "Fijos", "Impuestos", "Devoluciones/Ajustes"];

  const by: Record<string, { sum: number; note: string }> = {
    "Operativos": { sum: 0, note: "por venta (embalaje + mano de obra)" },
    "Insumos": { sum: 0, note: "consumibles del mes" },
    "Semi fijos": { sum: 0, note: "administración (escala con operación)" },
    "Fijos": { sum: 0, note: "estructura / suscripciones" },
    "Impuestos": { sum: 0, note: "IVA / IIBB / retenciones (demo)" },
    "Devoluciones/Ajustes": { sum: 0, note: "envío negativo + notas de crédito (demo)" },
  };

  tx.forEach((t) => (by[t.block].sum += t.amount));

  return order.map((name) => ({ name, amount: by[name].sum, note: by[name].note }));
}

export function stockMock(): StockRow[] {
  const rows: StockRow[] = [
    { sku: "REDMI14C-256", title: "Xiaomi Redmi 14C 256GB", onHand: 180, available: 152, committed: 28, daysCover: 9, value: 180 * 205_000, velocity: "Alta" },
    { sku: "REDMI14C-128", title: "Xiaomi Redmi 14C 128GB", onHand: 64, available: 52, committed: 12, daysCover: 5, value: 64 * 185_000, velocity: "Alta" },
    { sku: "DIGI-5", title: "Tarjeta digital 5 USD", onHand: 420, available: 420, committed: 0, daysCover: 20, value: 420 * 8_890, velocity: "Alta" },
    { sku: "DIGI-10", title: "Tarjeta digital 10 USD", onHand: 250, available: 250, committed: 0, daysCover: 18, value: 250 * 14_500, velocity: "Alta" },
    { sku: "DIGI-25", title: "Tarjeta digital 25 USD", onHand: 130, available: 130, committed: 0, daysCover: 14, value: 130 * 36_000, velocity: "Media" },
    { sku: "ACC-AURIC", title: "Auriculares In-Ear", onHand: 40, available: 35, committed: 5, daysCover: 6, value: 40 * 9_500, velocity: "Media" },
    { sku: "ACC-CABLE", title: "Cable USB-C", onHand: 22, available: 18, committed: 4, daysCover: 4, value: 22 * 1_800, velocity: "Alta" },
  ];
  return rows.sort((a,b)=> a.daysCover - b.daysCover);
}




// ==========================
// STOCK (WAC + compras + proyección) – mock UI
// ==========================
export type StockSkuMaster = {
  sku: string;
  model: string;
  category: "Celulares" | "Accesorios" | "Digital";
  mlas: string[];
  supplier?: string;
  salePriceEstimate: number; // ARS
  leadTimeDays: number;
  minStock: number;
  targetStock: number;
  unitCostFallback?: number; // si no hay compras cargadas
};

export type StockPurchase = {
  id: string;
  date: string; // YYYY-MM-DD
  sku: string;
  supplier: string;
  qty: number;
  totalCost: number; // ARS
  note?: string;
};

export function stockSkuMasterMock(): StockSkuMaster[] {
  return [
    {
      sku: "REDMI14C-256",
      model: "Xiaomi Redmi 14C 256GB",
      category: "Celulares",
      mlas: ["MLA1578118259", "MLA1578014623"],
      supplier: "Proveedor mayorista",
      salePriceEstimate: 308_971,
      leadTimeDays: 5,
      minStock: 40,
      targetStock: 160,
    },
    {
      sku: "REDMI14C-128",
      model: "Xiaomi Redmi 14C 128GB",
      category: "Celulares",
      mlas: ["MLA1581329863"],
      supplier: "Proveedor mayorista",
      salePriceEstimate: 289_990,
      leadTimeDays: 5,
      minStock: 30,
      targetStock: 120,
    },
    {
      sku: "ACC-AURIC",
      model: "Auriculares In‑Ear",
      category: "Accesorios",
      mlas: ["MLA2010210390"],
      supplier: "Distribuidor accesorios",
      salePriceEstimate: 14_999,
      leadTimeDays: 10,
      minStock: 20,
      targetStock: 80,
      unitCostFallback: 9_500,
    },
    {
      sku: "ACC-CABLE",
      model: "Cable USB‑C",
      category: "Accesorios",
      mlas: ["MLA2489430770"],
      supplier: "Distribuidor accesorios",
      salePriceEstimate: 3_499,
      leadTimeDays: 10,
      minStock: 30,
      targetStock: 120,
      unitCostFallback: 1_800,
    },
    {
      sku: "DIGI-5",
      model: "Tarjeta digital 5 USD",
      category: "Digital",
      mlas: [],
      salePriceEstimate: 17_981,
      leadTimeDays: 0,
      minStock: 0,
      targetStock: 0,
      unitCostFallback: 8_890,
    },
    {
      sku: "DIGI-10",
      model: "Tarjeta digital 10 USD",
      category: "Digital",
      mlas: [],
      salePriceEstimate: 23_000,
      leadTimeDays: 0,
      minStock: 0,
      targetStock: 0,
      unitCostFallback: 14_500,
    },
    {
      sku: "DIGI-25",
      model: "Tarjeta digital 25 USD",
      category: "Digital",
      mlas: [],
      salePriceEstimate: 45_000,
      leadTimeDays: 0,
      minStock: 0,
      targetStock: 0,
      unitCostFallback: 36_000,
    },
  ];
}

export function stockPurchasesMock(): StockPurchase[] {
  return [
    { id: "PO-1001", date: "2025-11-28", sku: "REDMI14C-256", supplier: "Proveedor mayorista", qty: 80, totalCost: 80 * 205_000, note: "Lote violeta" },
    { id: "PO-1012", date: "2025-12-06", sku: "REDMI14C-256", supplier: "Proveedor mayorista", qty: 100, totalCost: 100 * 208_000, note: "Reposición fin de semana" },

    { id: "PO-1002", date: "2025-11-26", sku: "REDMI14C-128", supplier: "Proveedor mayorista", qty: 60, totalCost: 60 * 182_000 },
    { id: "PO-1015", date: "2025-12-08", sku: "REDMI14C-128", supplier: "Proveedor mayorista", qty: 80, totalCost: 80 * 185_000 },

    { id: "PO-0907", date: "2025-10-20", sku: "ACC-AURIC", supplier: "Distribuidor accesorios", qty: 50, totalCost: 50 * 8_900 },
    { id: "PO-1010", date: "2025-12-03", sku: "ACC-AURIC", supplier: "Distribuidor accesorios", qty: 40, totalCost: 40 * 9_800 },

    { id: "PO-0911", date: "2025-10-25", sku: "ACC-CABLE", supplier: "Distribuidor accesorios", qty: 120, totalCost: 120 * 1_600 },
    { id: "PO-1018", date: "2025-12-10", sku: "ACC-CABLE", supplier: "Distribuidor accesorios", qty: 200, totalCost: 200 * 1_850 },
  ].sort((a,b)=> b.date.localeCompare(a.date));
}

// ==========================
// INSUMOS (mock UI)
// ==========================
export type SupplyItem = {
  id: string;
  name: string;
  category: "Embalaje" | "Etiquetado" | "Seguridad" | "Impresión" | "Postventa";
  unitBase: string; // ej: "unidad", "cm", "grampa"
  costUnit: number; // costo por unidad base (promedio)
  stock: number; // stock actual en unidad base
  perPack: number; // consumo por paquete (receta estándar)
  min: number; // stock mínimo
  target: number; // stock objetivo
  leadTimeDays: number;
  supplier?: string;
};

export type SupplyPurchase = {
  id: string;
  date: string; // YYYY-MM-DD
  supplier: string;
  itemId: string;
  qty: number; // en unidad base
  total: number; // ARS
  note?: string;
};

export type SupplyRecipe = {
  id: string;
  name: string; // ej. "Paquete estándar"
  items: Array<{ itemId: string; qty: number }>;
};

export function suppliesMock() {
  const items: SupplyItem[] = [
    {
      id: "burbuja",
      name: "Papel burbuja",
      category: "Embalaje",
      unitBase: "cm",
      costUnit: 1.0, // costo por cm (promedio)
      stock: 180_000,
      perPack: 30.67,
      min: 40_000,
      target: 200_000,
      leadTimeDays: 3,
      supplier: "Mayorista embalajes",
    },
    {
      id: "grampas",
      name: "Grampas",
      category: "Seguridad",
      unitBase: "grampa",
      costUnit: 1.37,
      stock: 8_500,
      perPack: 4,
      min: 2_000,
      target: 10_000,
      leadTimeDays: 2,
      supplier: "Librería",
    },
    {
      id: "bolsa",
      name: "Bolsa courier",
      category: "Embalaje",
      unitBase: "unidad",
      costUnit: 40,
      stock: 420,
      perPack: 1,
      min: 120,
      target: 600,
      leadTimeDays: 4,
      supplier: "Proveedor bolsas",
    },
    {
      id: "rotulo",
      name: "Rótulo/etiqueta",
      category: "Etiquetado",
      unitBase: "unidad",
      costUnit: 19,
      stock: 520,
      perPack: 1,
      min: 150,
      target: 700,
      leadTimeDays: 3,
      supplier: "Insumos impresión",
    },
  ];

  // compras (en unidad base)
  const purchases: SupplyPurchase[] = [
    { id: "p1", date: "2025-12-02", supplier: "Mayorista embalajes", itemId: "burbuja", qty: 120_000, total: 120_000, note: "Rollo burbuja (equivalente)" },
    { id: "p2", date: "2025-12-04", supplier: "Proveedor bolsas", itemId: "bolsa", qty: 300, total: 12_000 },
    { id: "p3", date: "2025-12-06", supplier: "Librería", itemId: "grampas", qty: 5_000, total: 6_850 },
    { id: "p4", date: "2025-12-09", supplier: "Insumos impresión", itemId: "rotulo", qty: 400, total: 7_600 },
  ];

  const recipes: SupplyRecipe[] = [
    {
      id: "std",
      name: "Paquete estándar",
      items: items.map((i) => ({ itemId: i.id, qty: i.perPack })),
    },
  ];

  return { items, purchases, recipes };
}
