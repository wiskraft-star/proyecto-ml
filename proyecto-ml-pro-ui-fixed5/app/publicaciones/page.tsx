"use client";

import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

type Listing = {
  itemId: string;
  sku: string;
  title: string;
  price: number;
  priceToWin: number;
  status: "Ganando" | "Perdiendo" | "Empatado";
  marginSafe: "OK" | "Riesgo";
};

const rows: Listing[] = [
  { itemId: "MLA1578118259", sku: "REDMI14C-256", title: "Redmi 14C 256GB", price: 334_971, priceToWin: 310_200, status: "Perdiendo", marginSafe: "Riesgo" },
  { itemId: "MLA1578014623", sku: "REDMI14C-256", title: "Redmi 14C 256GB (catálogo)", price: 288_471, priceToWin: 288_471, status: "Ganando", marginSafe: "OK" },
  { itemId: "MLA000000001", sku: "RBLX-10", title: "Roblox 10 USD", price: 23_000, priceToWin: 22_500, status: "Empatado", marginSafe: "OK" },
];

export default function PublicacionesPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Publicaciones" subtitle="Competitividad (price-to-win / buybox) + protección de margen. Modo demo." right={<Badge tone="neutral">Pricing</Badge>} />
        <CardBody>
          <div className="grid gap-4 md:grid-cols-3">
            <Metric label="Perdiendo" value="1" tone="bad" />
            <Metric label="Empatado" value="1" tone="warn" />
            <Metric label="Ganando" value="1" tone="good" />
          </div>

          <div className="mt-4">
            <Table>
              <THead>
                <TR className="border-t-0">
                  <TH>Item</TH>
                  <TH>SKU</TH>
                  <TH>Título</TH>
                  <TH className="text-right">Precio</TH>
                  <TH className="text-right">Price-to-win</TH>
                  <TH>Estado</TH>
                  <TH>Margen</TH>
                  <TH className="text-right">Acciones</TH>
                </TR>
              </THead>
              <tbody>
                {rows.map((r) => (
                  <TR key={r.itemId} className="hover:bg-panel2/40">
                    <TD className="font-medium">{r.itemId}</TD>
                    <TD className="text-muted">{r.sku}</TD>
                    <TD className="text-muted">{r.title}</TD>
                    <TD className="text-right">{r.price.toLocaleString("es-AR")}</TD>
                    <TD className="text-right">{r.priceToWin.toLocaleString("es-AR")}</TD>
                    <TD>
                      <Badge tone={r.status === "Ganando" ? "good" : r.status === "Perdiendo" ? "bad" : "warn"}>{r.status}</Badge>
                    </TD>
                    <TD>
                      <Badge tone={r.marginSafe === "OK" ? "good" : "warn"}>{r.marginSafe}</Badge>
                    </TD>
                    <TD className="text-right"><Button size="sm">Sugerir acción</Button></TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </div>

          <div className="mt-4 rounded-2xl border border-border bg-panel2/30 p-4 text-sm text-muted">
            En producción, la app calcula: “Podés bajar hasta X sin romper margen neto mínimo”, usando costos reales + comisiones + ads + envíos + devoluciones.
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "good"|"warn"|"bad"|"neutral" }) {
  return (
    <div className="rounded-2xl border border-border bg-panel2/30 p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      <div className="mt-2"><Badge tone={tone}>{tone.toUpperCase()}</Badge></div>
    </div>
  );
}
