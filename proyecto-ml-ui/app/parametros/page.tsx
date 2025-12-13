import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { env } from "@/lib/env";

export default function Parametros() {
  const envMissing = !env.supabaseUrl || !env.supabaseAnonKey;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Parámetros</h1>
          <p className="mt-1 text-sm text-zinc-600">Configuración base del proyecto (por ahora solo lectura).</p>
        </div>
        <Badge className={envMissing ? "text-rose-700 border-rose-200" : "text-emerald-700 border-emerald-200"}>
          {envMissing ? "Pendiente" : "OK"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Variables de entorno</CardTitle>
          <CardDescription>
            En Vercel deben estar cargadas como{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5">NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-zinc-700">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-3">
              <div>
                <div className="font-medium">NEXT_PUBLIC_SUPABASE_URL</div>
                <div className="text-xs text-zinc-500">URL pública de tu proyecto Supabase</div>
              </div>
              <Badge className={env.supabaseUrl ? "text-emerald-700 border-emerald-200" : "text-rose-700 border-rose-200"}>
                {env.supabaseUrl ? "OK" : "Falta"}
              </Badge>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-3">
              <div>
                <div className="font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY</div>
                <div className="text-xs text-zinc-500">Clave pública (anon) para el frontend</div>
              </div>
              <Badge className={env.supabaseAnonKey ? "text-emerald-700 border-emerald-200" : "text-rose-700 border-rose-200"}>
                {env.supabaseAnonKey ? "OK" : "Falta"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roadmap UI (fase 1)</CardTitle>
          <CardDescription>Esto es lo que completamos en esta entrega.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700">
            <li>Layout profesional con sidebar + topbar + navegación mobile.</li>
            <li>Dashboard con tarjetas de métricas y “próximo paso”.</li>
            <li>Páginas base: Ventas, Gastos, Stock, Parámetros.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
