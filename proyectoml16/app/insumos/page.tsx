import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

function num(v: FormDataEntryValue | null): number {
  if (typeof v !== "string") return 0;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export default async function InsumosPage(): Promise<JSX.Element> {
  const supplies = await prisma.supply.findMany({ orderBy: { name: "asc" } });
  const recipeLines = await prisma.supplyRecipeLine.findMany({
    include: { supply: true },
    orderBy: { supply: { name: "asc" } },
  });

  const costPerSale = recipeLines.reduce((acc, line) => {
    const unit = (line.supply.unitCost as unknown as Prisma.Decimal).toNumber();
    const qty = (line.qtyPerSale as unknown as Prisma.Decimal).toNumber();
    return acc + unit * qty;
  }, 0);

  async function upsertSupply(formData: FormData): Promise<void> {
    "use server";
    const name = String(formData.get("name") ?? "").trim();
    const unitCost = num(formData.get("unitCost"));
    if (!name) return;

    await prisma.supply.upsert({
      where: { name },
      create: { name, unitCost: new Prisma.Decimal(unitCost) },
      update: { unitCost: new Prisma.Decimal(unitCost) },
    });

    revalidatePath("/insumos");
  }

  async function deleteSupply(formData: FormData): Promise<void> {
    "use server";
    const id = String(formData.get("id") ?? "").trim();
    if (!id) return;
    await prisma.supply.delete({ where: { id } }).catch(() => null);
    revalidatePath("/insumos");
  }

  async function upsertRecipeLine(formData: FormData): Promise<void> {
    "use server";
    const supplyId = String(formData.get("supplyId") ?? "").trim();
    const qtyPerSale = num(formData.get("qtyPerSale"));
    if (!supplyId) return;

    await prisma.supplyRecipeLine.upsert({
      where: { supplyId },
      create: { supplyId, qtyPerSale: new Prisma.Decimal(qtyPerSale) },
      update: { qtyPerSale: new Prisma.Decimal(qtyPerSale) },
    });

    revalidatePath("/insumos");
    revalidatePath("/metricas");
  }

  async function deleteRecipeLine(formData: FormData): Promise<void> {
    "use server";
    const supplyId = String(formData.get("supplyId") ?? "").trim();
    if (!supplyId) return;
    await prisma.supplyRecipeLine.delete({ where: { supplyId } }).catch(() => null);
    revalidatePath("/insumos");
    revalidatePath("/metricas");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Insumos</h1>

      <Card title="CRUD Insumos">
        <form action={upsertSupply} className="flex flex-col md:flex-row gap-2 md:items-end">
          <div className="flex-1">
            <label className="text-xs text-zinc-600">Nombre</label>
            <input name="name" className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="Ej: burbuja" />
          </div>
          <div className="w-full md:w-48">
            <label className="text-xs text-zinc-600">Costo unitario</label>
            <input name="unitCost" className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="Ej: 95.15" />
          </div>
          <button className="px-3 py-2 rounded-lg bg-zinc-900 text-white text-sm">Guardar</button>
        </form>

        <div className="mt-4">
          <Table headers={["Nombre", "Costo unitario", "Acciones"]}>
            {supplies.map((s) => (
              <tr key={s.id}>
                <td className="py-2 pr-4">{s.name}</td>
                <td className="py-2 pr-4">{(s.unitCost as unknown as Prisma.Decimal).toNumber()}</td>
                <td className="py-2 pr-4">
                  <form action={deleteSupply}>
                    <input type="hidden" name="id" value={s.id} />
                    <button className="text-xs px-2 py-1 border rounded-lg">Eliminar</button>
                  </form>
                </td>
              </tr>
            ))}
          </Table>
        </div>
      </Card>

      <Card title="Receta por venta (global)">
        <div className="text-sm mb-2">
          Costo de insumos por venta: <span className="font-semibold">{costPerSale.toFixed(2)}</span>
        </div>

        <form action={upsertRecipeLine} className="flex flex-col md:flex-row gap-2 md:items-end">
          <div className="flex-1">
            <label className="text-xs text-zinc-600">Insumo</label>
            <select name="supplyId" className="w-full mt-1 px-3 py-2 border rounded-lg">
              <option value="">Seleccionar</option>
              {supplies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full md:w-48">
            <label className="text-xs text-zinc-600">Qty por venta</label>
            <input name="qtyPerSale" className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="Ej: 1" />
          </div>
          <button className="px-3 py-2 rounded-lg bg-zinc-900 text-white text-sm">Guardar</button>
        </form>

        <div className="mt-4">
          <Table headers={["Insumo", "Qty por venta", "Costo unitario", "Subtotal", "Acciones"]}>
            {recipeLines.map((l) => {
              const unit = (l.supply.unitCost as unknown as Prisma.Decimal).toNumber();
              const qty = (l.qtyPerSale as unknown as Prisma.Decimal).toNumber();
              const subtotal = unit * qty;
              return (
                <tr key={l.id}>
                  <td className="py-2 pr-4">{l.supply.name}</td>
                  <td className="py-2 pr-4">{qty}</td>
                  <td className="py-2 pr-4">{unit}</td>
                  <td className="py-2 pr-4">{subtotal.toFixed(2)}</td>
                  <td className="py-2 pr-4">
                    <form action={deleteRecipeLine} className="inline">
                      <input type="hidden" name="supplyId" value={l.supplyId} />
                      <button className="text-xs px-2 py-1 border rounded-lg">Eliminar</button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </Table>
        </div>
      </Card>
    </div>
  );
}
