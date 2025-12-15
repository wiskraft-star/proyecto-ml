import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import type { SkuCost } from "@prisma/client";

function num(v: FormDataEntryValue | null): number {
  if (typeof v !== "string") return 0;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export default async function StockCostosPage(): Promise<JSX.Element> {
  const rows: SkuCost[] = await prisma.skuCost.findMany({ orderBy: { updatedAt: "desc" } });

  async function upsertSkuCost(formData: FormData): Promise<void> {
    "use server";
    const sku = String(formData.get("sku") ?? "").trim();
    const unitCost = num(formData.get("unitCost"));
    if (!sku) return;

    await prisma.skuCost.upsert({
      where: { sku },
      create: { sku, unitCost: new Prisma.Decimal(unitCost) },
      update: { unitCost: new Prisma.Decimal(unitCost) },
    });

    revalidatePath("/stock-costos");
    revalidatePath("/metricas");
  }

  async function deleteSkuCost(formData: FormData): Promise<void> {
    "use server";
    const sku = String(formData.get("sku") ?? "").trim();
    if (!sku) return;
    await prisma.skuCost.delete({ where: { sku } }).catch(() => null);
    revalidatePath("/stock-costos");
    revalidatePath("/metricas");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Stock/Costos (COGS)</h1>

      <Card title="CRUD COGS por SKU">
        <form action={upsertSkuCost} className="flex flex-col md:flex-row gap-2 md:items-end">
          <div className="flex-1">
            <label className="text-xs text-zinc-600">SKU</label>
            <input name="sku" className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="Ej: RBLX-25" />
          </div>
          <div className="w-full md:w-48">
            <label className="text-xs text-zinc-600">Costo unitario</label>
            <input name="unitCost" className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="Ej: 36000" />
          </div>
          <button className="px-3 py-2 rounded-lg bg-zinc-900 text-white text-sm">Guardar</button>
        </form>

        <div className="mt-4">
          <Table headers={["SKU", "Costo unitario", "Updated", "Acciones"]}>
            {rows.map((r) => (
              <tr key={r.sku}>
                <td className="py-2 pr-4">{r.sku}</td>
                <td className="py-2 pr-4">{(r.unitCost as unknown as Prisma.Decimal).toNumber()}</td>
                <td className="py-2 pr-4">{r.updatedAt.toISOString()}</td>
                <td className="py-2 pr-4">
                  <form action={deleteSkuCost}>
                    <input type="hidden" name="sku" value={r.sku} />
                    <button className="text-xs px-2 py-1 border rounded-lg">Eliminar</button>
                  </form>
                </td>
              </tr>
            ))}
          </Table>
        </div>
      </Card>
    </div>
  );
}
