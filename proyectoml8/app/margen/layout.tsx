import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { MargenTabs } from "@/components/margen/margen-tabs";

export default function MargenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Sistema margen neto (MVP)" subtitle="Ventas ↔ Cobros/Liquidaciones ↔ COGS ↔ Insumos ↔ Mano de obra → Métricas" />
        <CardBody>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-muted">
              Objetivo: ver margen neto real por venta y por mes, usando Cobros como “verdad financiera”.
            </div>
            <MargenTabs />
          </div>
        </CardBody>
      </Card>

      {children}
    </div>
  );
}
