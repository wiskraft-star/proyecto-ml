import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import { parseMonthParam, money, isoDate, toNumberDecimal } from "@/lib/utils/format";
import { aggregateMonth, computeSaleCogs, computeSaleMargin, getSuppliesCostPerSale, SaleMarginRow } from "@/lib/margin/compute";

function matchPaymentToSale(params: {
  saleEconomicId: string;
  saleOrderId: string | null;
  salePackId: string | null;
  paymentEconomicId: string | null;
  paymentOrderId: string | null;
  paymentPackId: string | null;
}): boolean {
  const { saleEconomicId, saleOrderId, salePackId, paymentEconomicId, paymentOrderId, paymentPackId } = params;

  if (paymentEconomicId && paymentEconomicId === saleEconomicId) return true;
  if (saleOrderId && paymentEconomicId && paymentEconomicId === saleOrderId) return true;
  if (salePackId && paymentEconomicId && paymentEconomicId === salePackId) return true;

  if (saleOrderId && paymentOrderId && saleOrderId === paymentOrderId) return true;
  if (salePackId && paymentPackId && salePackId === paymentPackId) return true;

  return false;
}

export default async function MetricasPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}): Promise<JSX.Element> {
  const month = typeof searchParams.month === "string" ? searchParams.month : null;
  const { from, to, key } = parseMonthParam(month);

  const sales = await prisma.sale.findMany({
    where: { date: { gte: from, lt: to } },
    include: { items: true },
    orderBy: { date: "desc" },
    take: 500,
  });

  const payments = await prisma.payment.findMany({
    where: { paidAt: { gte: from, lt: to } },
    orderBy: { paidAt: "desc" },
    take: 2000,
  });

  const skuCostsArr = await prisma.skuCost.findMany();
  const skuCosts = new Map(skuCostsArr.map((c) => [c.sku, c]));

  const recipeLines = await prisma.supplyRecipeLine.findMany({ include: { supply: true } });
  const suppliesCostPerSale = getSuppliesCostPerSale(recipeLines);

  const rows: SaleMarginRow[] = sales.map((s) => {
    const matched = payments.find((p) =>
      matchPaymentToSale({
        saleEconomicId: s.economicId,
        saleOrderId: s.orderId ?? null,
        salePackId: s.packId ?? null,
        paymentEconomicId: p.economicId ?? null,
        paymentOrderId: p.orderId ?? null,
        paymentPackId: p.packId ?? null,
      }),
    );

    const cogs = computeSaleCogs(s.items, skuCosts);
    const supplies = suppliesCostPerSale;

    if (!matched) {
      return { economicId: s.economicId, date: s.date, net: null, cogs, supplies, margin: null, status: "SIN_COBRO" };
    }

    const net = toNumberDecimal(matched.netAmount);
    const margin = computeSaleMargin(net, cogs, supplies);
    return { economicId: s.economicId, date: s.date, net, cogs, supplies, margin, status: "OK" };
  });

  const agg = aggregateMonth(rows);

  const monthOptions = (() => {
    const now = new Date();
    const opts: string[] = [];
    for (let i = 0; i < 12; i += 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      opts.push(`${y}-${m}`);
    }
    return opts;
  })();

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <h1 className="text-xl font-semibold">Métricas</h1>
        <form className="flex items-center gap-2" action="/metricas" method="GET">
          <select name="month" defaultValue={key} className="px-3 py-2 border rounded-lg text-sm bg-white">
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <button className="px-3 py-2 rounded-lg bg-zinc-900 text-white text-sm">Ver</button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card title="Facturación real (neto)">
          <div className="text-lg font-semibold">{money(agg.netTotal)}</div>
          <div className="text-xs text-zinc-500 mt-1">SUM netAmount (solo ventas con cobro vinculado)</div>
        </Card>

        <Card title="COGS total">
          <div className="text-lg font-semibold">{money(agg.cogsTotal)}</div>
          <div className="text-xs text-zinc-500 mt-1">SKU unitCost * qty</div>
        </Card>

        <Card title="Insumos total">
          <div className="text-lg font-semibold">{money(agg.suppliesTotal)}</div>
          <div className="text-xs text-zinc-500 mt-1">{money(suppliesCostPerSale)} por venta * ventas con cobro</div>
        </Card>

        <Card title="Margen neto total">
          <div className="text-lg font-semibold">{money(agg.marginTotal)}</div>
          <div className="text-xs text-zinc-500 mt-1">
            % margen: {agg.marginPct === null ? "-" : `${(agg.marginPct * 100).toFixed(2)}%`}
          </div>
        </Card>
      </div>

      <Card title={`Venta por venta (mes ${key}) | OK: ${agg.linkedCount} | sin cobro: ${agg.unlinkedCount}`}>
        <div className="text-xs text-zinc-600 mb-3">Regla: solo se computa margen cuando existe netAmount (cobro vinculado).</div>
        <Table headers={["Fecha", "economicId", "Neto", "COGS", "Insumos", "Margen", "Estado"]}>
          {rows.map((r) => (
            <tr key={r.economicId}>
              <td className="py-2 pr-4">{isoDate(r.date)}</td>
              <td className="py-2 pr-4">{r.economicId}</td>
              <td className="py-2 pr-4">{r.net === null ? "-" : money(r.net)}</td>
              <td className="py-2 pr-4">{money(r.cogs)}</td>
              <td className="py-2 pr-4">{money(r.supplies)}</td>
              <td className="py-2 pr-4">{r.margin === null ? "-" : money(r.margin)}</td>
              <td className="py-2 pr-4">
                {r.status === "OK" ? (
                  <span className="text-xs px-2 py-1 rounded-lg bg-green-50 border border-green-200">OK</span>
                ) : (
                  <span className="text-xs px-2 py-1 rounded-lg bg-amber-50 border border-amber-200">sin cobro vinculado</span>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card title="Explicación de cálculos (por venta)">
        <ul className="text-sm list-disc pl-5 space-y-1 text-zinc-700">
          <li><span className="font-medium">Neto:</span> Payment.netAmount (Mercado Pago).</li>
          <li><span className="font-medium">COGS:</span> sum(SaleItem.qty * SkuCost.unitCost) para cada SKU.</li>
          <li><span className="font-medium">Insumos:</span> costoRecetaGlobalPorVenta (se aplica a todas las ventas).</li>
          <li><span className="font-medium">Margen:</span> neto - cogs - insumos.</li>
        </ul>
      </Card>
    </div>
  );
}
