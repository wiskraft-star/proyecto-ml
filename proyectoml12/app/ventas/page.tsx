import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import { parseMonthParam, isoDate } from "@/lib/utils/format";
import { SyncButton } from "@/components/SyncButton";
import type { Prisma } from "@prisma/client";

type SaleWithItems = Prisma.SaleGetPayload<{ include: { items: true } }>;

export default async function VentasPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}): Promise<JSX.Element> {
  const month = typeof searchParams.month === "string" ? searchParams.month : null;
  const { from, to, key } = parseMonthParam(month);

  const sales: SaleWithItems[] = await prisma.sale.findMany({
    where: { date: { gte: from, lt: to } },
    include: { items: true },
    orderBy: { date: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <h1 className="text-xl font-semibold">Ventas</h1>
        <SyncButton endpoint="/api/sync/ml-sales" label="Sincronizar Ventas (ML)" month={key} />
      </div>

      <Card title={`Mes: ${key} (máx 200 filas)`}>
        <Table headers={["Fecha", "economicId", "Estado", "Items (sku x qty)"]}>
          {sales.map((s) => (
            <tr key={s.id}>
              <td className="py-2 pr-4">{isoDate(s.date)}</td>
              <td className="py-2 pr-4">{s.economicId}</td>
              <td className="py-2 pr-4">{s.status}</td>
              <td className="py-2 pr-4">
                <div className="text-xs text-zinc-700">
                  {s.items.map((it) => `${it.sku} x${it.qty}`).join(" | ")}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
