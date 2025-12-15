import { requireUser } from "@/lib/auth";
import { envServer } from "@/lib/env";
import { listSkuCosts } from "@/lib/db/skuCosts";
import type { SkuCost } from "@/lib/db/types";
import { SkuCostsEditor } from "@/components/SkuCostsEditor";

function parseSellerId(): number {
  const n = Number(envServer.mlSellerId);
  return Number.isFinite(n) && n > 0 ? n : 141795397;
}

export default async function CostosPage() {
  await requireUser();

  const seller_id = parseSellerId();
  const rows: SkuCost[] = await listSkuCosts(seller_id);

  return (
    <main className="card">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="h1">Costos por SKU (COGS)</div>
          <div className="small">
            Tabla: <span className="mono">app.sku_costs</span> (seller_id {seller_id})
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <SkuCostsEditor sellerId={seller_id} initialRows={rows} />
      </div>

      <p className="small" style={{ marginTop: 12 }}>
        Tip: si un SKU no tiene costo cargado, el margen en métricas va a quedar subestimado (COGS=0).
      </p>
    </main>
  );
}
