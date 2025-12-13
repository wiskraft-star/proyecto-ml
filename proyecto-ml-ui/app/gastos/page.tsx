import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Page() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Gastos</h1>
          <p className="mt-1 text-sm text-zinc-600">Bloques de gastos mensuales y detalle (con devoluciones).</p>
        </div>
        <Badge>Gastos</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estado</CardTitle>
          <CardDescription>UI lista; conectaremos datos en el siguiente paso.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-zinc-700">
            Aquí va el contenido real (tablas, filtros, métricas, etc.). Por ahora dejamos placeholders bien presentados.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
