import { salesMock, stockPurchasesMock, stockSkuMasterMock, type SaleRow, type StockPurchase, type StockSkuMaster } from "@/lib/mock";

export type CostMode = "wac" | "last";

export type UnitCostInfo = {
  sku: string;
  wac?: number;
  last?: number;
  fallback?: number;
  source: "wac" | "last" | "fallback" | "missing";
  unitCost: number;
};

export type OpsCostRule = {
  packagingPerShipment: number;
  laborPerShipment: number;
  digitalPackaging: number;
  digitalLabor: number;
};

export const DEFAULT_OPS_RULE: OpsCostRule = {
  packagingPerShipment: 200,
  laborPerShipment: 400,
  digitalPackaging: 0,
  digitalLabor: 0,
};

function isDigitalSku(sku: string) {
  return sku.toUpperCase().startsWith("DIGI");
}

function lastBySku(purchases: StockPurchase[]) {
  const sorted = [...purchases].sort((a, b) => b.date.localeCompare(a.date));
  const map = new Map<string, StockPurchase>();
  for (const p of sorted) {
    if (!map.has(p.sku)) map.set(p.sku, p);
  }
  return map;
}

export function buildUnitCostMap() {
  const purchases = stockPurchasesMock();
  const master = stockSkuMasterMock();

  const wacBySku = new Map<string, { total: number; qty: number }>();
  for (const p of purchases) {
    const cur = wacBySku.get(p.sku) ?? { total: 0, qty: 0 };
    cur.total += p.totalCost;
    cur.qty += p.qty;
    wacBySku.set(p.sku, cur);
  }

  const lastPurchase = lastBySku(purchases);
  const fallbackBySku = new Map<string, number>();
  for (const m of master) {
    if (typeof m.unitCostFallback === "number") fallbackBySku.set(m.sku, m.unitCostFallback);
  }

  const allSkus = new Set<string>([...Array.from(wacBySku.keys()), ...Array.from(fallbackBySku.keys()), ...master.map((m) => m.sku)]);

  const out = new Map<string, UnitCostInfo>();
  for (const sku of allSkus) {
    const w = wacBySku.get(sku);
    const wac = w && w.qty ? w.total / w.qty : undefined;
    const lp = lastPurchase.get(sku);
    const last = lp && lp.qty ? lp.totalCost / lp.qty : undefined;
    const fallback = fallbackBySku.get(sku);

    let unitCost = 0;
    let source: UnitCostInfo["source"] = "missing";

    if (typeof wac === "number" && Number.isFinite(wac) && wac > 0) {
      unitCost = wac;
      source = "wac";
    } else if (typeof last === "number" && Number.isFinite(last) && last > 0) {
      unitCost = last;
      source = "last";
    } else if (typeof fallback === "number" && Number.isFinite(fallback) && fallback > 0) {
      unitCost = fallback;
      source = "fallback";
    }

    out.set(sku, { sku, wac, last, fallback, source, unitCost });
  }

  return out;
}

export function unitCostForSku(costMap: Map<string, UnitCostInfo>, sku: string, mode: CostMode = "wac") {
  const info = costMap.get(sku);
  if (!info) return { sku, unitCost: 0, source: "missing" as const };

  const preferred = mode === "last" ? info.last : info.wac;
  if (typeof preferred === "number" && Number.isFinite(preferred) && preferred > 0) {
    return { sku, unitCost: preferred, source: mode as "wac" | "last" };
  }

  if (typeof info.fallback === "number" && Number.isFinite(info.fallback) && info.fallback > 0) {
    return { sku, unitCost: info.fallback, source: "fallback" as const };
  }

  // fallback final: lo que ya haya quedado elegido por el builder
  return { sku, unitCost: info.unitCost, source: info.source };
}

export function opsCostsForSale(row: Pick<SaleRow, "sku" | "qty">, rule: OpsCostRule = DEFAULT_OPS_RULE) {
  const digital = isDigitalSku(row.sku);
  const packaging = digital ? rule.digitalPackaging : rule.packagingPerShipment;
  const labor = digital ? rule.digitalLabor : rule.laborPerShipment;
  return { packaging, labor };
}

export type MarginRow = {
  orderId: string;
  date: string;
  sku: string;
  title: string;
  qty: number;
  gross: number;
  net: number;
  cogs: number;
  packaging: number;
  labor: number;
  marginNet: number;
  marginPct: number;
  costSource: UnitCostInfo["source"];
};

export function marginRows({
  costMode = "wac",
  opsRule = DEFAULT_OPS_RULE,
}: {
  costMode?: CostMode;
  opsRule?: OpsCostRule;
} = {}) {
  const costMap = buildUnitCostMap();
  const sales = salesMock();

  return sales.map((r) => {
    const unit = unitCostForSku(costMap, r.sku, costMode);
    const cogs = (unit.unitCost || 0) * (r.qty || 0);
    const { packaging, labor } = opsCostsForSale(r, opsRule);
    const marginNet = (r.net || 0) - cogs - packaging - labor;
    const marginPct = r.gross ? marginNet / r.gross : 0;
    return {
      orderId: r.orderId,
      date: r.date,
      sku: r.sku,
      title: r.title,
      qty: r.qty,
      gross: r.gross,
      net: r.net,
      cogs,
      packaging,
      labor,
      marginNet,
      marginPct,
      costSource: unit.source,
    } satisfies MarginRow;
  });
}
