import { requireUser } from "@/lib/auth";
import { envServer } from "@/lib/env";
import { listSupplies } from "@/lib/db/supplies";
import { listRecipeLines } from "@/lib/db/recipe";
import type { Supply, SupplyRecipeLine } from "@/lib/db/types";
import { SuppliesRecipeEditor } from "@/components/SuppliesRecipeEditor";

function parseSellerId(): number {
  const n = Number(envServer.mlSellerId);
  return Number.isFinite(n) && n > 0 ? n : 141795397;
}

export default async function InsumosPage() {
  await requireUser();

  const seller_id = parseSellerId();
  const supplies: Supply[] = await listSupplies(seller_id);
  const recipe: SupplyRecipeLine[] = await listRecipeLines(seller_id);

  return (
    <main className="card">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="h1">Insumos + Receta global</div>
          <div className="small">
            Tablas: <span className="mono">app.supplies</span> y <span className="mono">app.supply_recipe_lines</span> (seller_id {seller_id})
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <SuppliesRecipeEditor sellerId={seller_id} initialSupplies={supplies} initialRecipeLines={recipe} />
      </div>

      <p className="small" style={{ marginTop: 12 }}>
        Esta receta es <strong>global</strong>: aplica el mismo costo de insumos a todas las ventas del seller. Si querés recetas por SKU, lo hacemos como mejora.
      </p>
    </main>
  );
}
