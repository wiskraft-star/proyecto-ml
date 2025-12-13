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
    { orderId: "2000010200016693", date: "2025-12-12", sku: "REDMI14C-256", title: "Xiaomi Redmi 14C 256GB", qty: 1, gross: 308_971, fees: 47_890, shipping: 28_400, ads: 12_500, refunds: 0, net: 220_181, status: "Entregado" },
    { orderId: "2000010194403901", date: "2025-12-12", sku: "RBLX-10", title: "Tarjeta Roblox 10 USD", qty: 1, gross: 23_000, fees: 3_565, shipping: 0, ads: 1_100, refunds: 0, net: 18_335, status: "Entregado" },
    { orderId: "2000010171546565", date: "2025-12-11", sku: "REDMI14C-128", title: "Xiaomi Redmi 14C 128GB", qty: 1, gross: 289_999, fees: 44_950, shipping: 28_400, ads: 10_800, refunds: 28_400, net: 177_449, status: "Devuelto" },
    { orderId: "2000010135617651", date: "2025-12-10", sku: "RBLX-5", title: "Tarjeta Roblox 5 USD", qty: 1, gross: 17_981, fees: 2_787, shipping: 0, ads: 900, refunds: 0, net: 14_294, status: "Entregado" },
    { orderId: "2000010127351765", date: "2025-12-10", sku: "ACC-CABLE", title: "Cable USB-C", qty: 2, gross: 14_500, fees: 2_200, shipping: 0, ads: 0, refunds: 0, net: 12_300, status: "Entregado" },
  ];

  // Expand a bit
  const extra: SaleRow[] = Array.from({ length: 20 }).map((_, i) => {
    const day = 2 + (i % 10);
    const date = `2025-12-${String(day).padStart(2,"0")}`;
    const isRblx = i % 3 === 0;
    const sku = isRblx ? (i % 2 ? "RBLX-5" : "RBLX-25") : (i % 2 ? "REDMI14C-256" : "ACC-AURIC");
    const title = sku.startsWith("RBLX") ? `Tarjeta Roblox ${sku.split("-")[1]} USD` : (sku==="ACC-AURIC" ? "Auriculares In-Ear" : "Xiaomi Redmi 14C 256GB");
    const gross = sku==="RBLX-25" ? 39_990 : sku==="RBLX-5" ? 18_500 : sku==="ACC-AURIC" ? 24_999 : 308_971;
    const fees = Math.round(gross * (isRblx ? 0.155 : 0.145));
    const ads = isRblx ? Math.round(gross * 0.05) : Math.round(gross * 0.035);
    const shipping = sku.startsWith("REDMI") ? 28_400 : 0;
    const refunds = (i % 13 === 0) ? shipping : 0;
    const net = Math.max(0, gross - fees - ads - shipping - refunds);
    const status: SaleRow["status"] = refunds ? "Devuelto" : (i%7==0 ? "En camino" : "Entregado");
    return { orderId: `2000010${200000000+i}`, date, sku, title, qty: sku==="ACC-CABLE"?2:1, gross, fees, shipping, ads, refunds, net, status };
  });

  return [...base, ...extra].sort((a,b)=> b.date.localeCompare(a.date));
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

export function expensesMock(): ExpenseBlock[] {
  return [
    { name: "Embalaje", amount: 1_200_000, note: "c/u × envíos despachados" },
    { name: "Mano de obra", amount: 2_100_000, note: "armado/packing" },
    { name: "Insumos", amount: 850_000, note: "cinta, burbuja, bolsas" },
    { name: "Factura ML (20/21)", amount: 2_000_000, note: "cargo mensual" },
    { name: "Contador", amount: 380_000, note: "honorarios" },
    { name: "SaaS (Nubimetrics, hosting, etc.)", amount: 260_000, note: "mensual" },
  ];
}

export function stockMock(): StockRow[] {
  const rows: StockRow[] = [
    { sku: "REDMI14C-256", title: "Xiaomi Redmi 14C 256GB", onHand: 180, available: 152, committed: 28, daysCover: 9, value: 180 * 205_000, velocity: "Alta" },
    { sku: "REDMI14C-128", title: "Xiaomi Redmi 14C 128GB", onHand: 64, available: 52, committed: 12, daysCover: 5, value: 64 * 185_000, velocity: "Alta" },
    { sku: "RBLX-5", title: "Tarjeta Roblox 5 USD", onHand: 420, available: 420, committed: 0, daysCover: 20, value: 420 * 8_890, velocity: "Alta" },
    { sku: "RBLX-10", title: "Tarjeta Roblox 10 USD", onHand: 250, available: 250, committed: 0, daysCover: 18, value: 250 * 14_500, velocity: "Alta" },
    { sku: "RBLX-25", title: "Tarjeta Roblox 25 USD", onHand: 130, available: 130, committed: 0, daysCover: 14, value: 130 * 36_000, velocity: "Media" },
    { sku: "ACC-AURIC", title: "Auriculares In-Ear", onHand: 40, available: 35, committed: 5, daysCover: 6, value: 40 * 9_500, velocity: "Media" },
    { sku: "ACC-CABLE", title: "Cable USB-C", onHand: 22, available: 18, committed: 4, daysCover: 4, value: 22 * 1_800, velocity: "Alta" },
  ];
  return rows.sort((a,b)=> a.daysCover - b.daysCover);
}
