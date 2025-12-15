import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import { parseMonthParam, isoDate, money, toNumberDecimal } from "@/lib/utils/format";
import { SyncButton } from "@/components/SyncButton";
import { revalidatePath } from "next/cache";
import type { Payment } from "@prisma/client";

export default async function CobrosPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}): Promise<JSX.Element> {
  const month = typeof searchParams.month === "string" ? searchParams.month : null;
  const { from, to, key } = parseMonthParam(month);

  const payments = await prisma.payment.findMany({
    where: { paidAt: { gte: from, lt: to } },
    orderBy: { paidAt: "desc" },
    take: 200,
  });

  async function linkPayment(formData: FormData): Promise<void> {
    "use server";
    const id = String(formData.get("id") ?? "").trim();
    const economicId = String(formData.get("economicId") ?? "").trim();
    if (!id) return;
    await prisma.payment.update({
      where: { id },
      data: { economicId: economicId.length ? economicId : null },
    });
    revalidatePath("/cobros");
    revalidatePath("/metricas");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <h1 className="text-xl font-semibold">Cobros</h1>
        <SyncButton endpoint="/api/sync/mp-payments" label="Sincronizar Cobros (MP)" month={key} />
      </div>

      <Card title={`Mes: ${key} (máx 200 filas)`}>
        <Table headers={["PaidAt", "mpPaymentId", "economicId", "Neto (te quedó)", "Bruto", "Fees", "Link", "Raw"]}>
          {payments.map((p: Payment) => {
            const net = toNumberDecimal(p.netAmount);
            const gross = toNumberDecimal(p.grossAmount);
            const fees = toNumberDecimal(p.feesAmount);
            const linked = Boolean(p.economicId && p.economicId.length > 0);
            return (
              <tr key={p.id}>
                <td className="py-2 pr-4">{isoDate(p.paidAt)}</td>
                <td className="py-2 pr-4">{p.mpPaymentId ?? "-"}</td>
                <td className="py-2 pr-4">{p.economicId ?? "-"}</td>
                <td className="py-2 pr-4">{money(net)}</td>
                <td className="py-2 pr-4">{gross ? money(gross) : "-"}</td>
                <td className="py-2 pr-4">{fees ? money(fees) : "-"}</td>
                <td className="py-2 pr-4">
                  {linked ? (
                    <span className="text-xs px-2 py-1 rounded-lg bg-green-50 border border-green-200">OK</span>
                  ) : (
                    <form action={linkPayment} className="flex gap-2 items-center">
                      <input type="hidden" name="id" value={p.id} />
                      <input
                        name="economicId"
                        className="w-40 px-2 py-1 border rounded-lg text-xs"
                        placeholder="pack_id u order_id"
                      />
                      <button className="text-xs px-2 py-1 border rounded-lg">Vincular</button>
                    </form>
                  )}
                </td>
                <td className="py-2 pr-4">
                  <details>
                    <summary className="text-xs cursor-pointer">ver</summary>
                    <pre className="text-[10px] whitespace-pre-wrap max-w-[420px] bg-zinc-50 border border-zinc-200 rounded-lg p-2 mt-2">
{JSON.stringify(p.sourceRaw, null, 2)}
                    </pre>
                  </details>
                </td>
              </tr>
            );
          })}
        </Table>
      </Card>
    </div>
  );
}
