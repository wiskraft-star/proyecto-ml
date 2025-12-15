import { Prisma, Supply, SupplyRecipeLine, SkuCost, SaleItem } from "@prisma/client";

export type SaleMarginRow = {
  economicId: string;
  date: Date;
  net: number | null;
  cogs: number;
  supplies: number;
  margin: number | null;
  status: "OK" | "SIN_COBRO";
};

export function getSuppliesCostPerSale(lines: Array<SupplyRecipeLine & { supply: Supply }>): number {
  return lines.reduce((acc, line) => {
    const unit = (line.supply.unitCost as unknown as Prisma.Decimal).toNumber();
    const qty = (line.qtyPerSale as unknown as Prisma.Decimal).toNumber();
    return acc + unit * qty;
  }, 0);
}

export function computeSaleCogs(items: SaleItem[], skuCosts: Map<string, SkuCost>): number {
  let total = 0;
  for (const it of items) {
    const cost = skuCosts.get(it.sku);
    if (!cost) continue;
    const unit = (cost.unitCost as unknown as Prisma.Decimal).toNumber();
    total += unit * it.qty;
  }
  return total;
}

export function computeSaleMargin(net: number, cogs: number, suppliesCost: number): number {
  return net - cogs - suppliesCost;
}

export function aggregateMonth(rows: SaleMarginRow[]): {
  netTotal: number;
  cogsTotal: number;
  suppliesTotal: number;
  marginTotal: number;
  marginPct: number | null;
  linkedCount: number;
  unlinkedCount: number;
} {
  let netTotal = 0;
  let cogsTotal = 0;
  let suppliesTotal = 0;
  let marginTotal = 0;
  let linkedCount = 0;
  let unlinkedCount = 0;

  for (const r of rows) {
    if (r.status !== "OK" || r.net === null || r.margin === null) {
      unlinkedCount += 1;
      continue;
    }
    linkedCount += 1;
    netTotal += r.net;
    cogsTotal += r.cogs;
    suppliesTotal += r.supplies;
    marginTotal += r.margin;
  }

  const marginPct = netTotal > 0 ? marginTotal / netTotal : null;
  return { netTotal, cogsTotal, suppliesTotal, marginTotal, marginPct, linkedCount, unlinkedCount };
}
