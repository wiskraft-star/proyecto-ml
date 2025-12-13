"use client";

import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function IntegracionesPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Integraciones" subtitle="Conexiones, sync y salud del sistema." right={<Badge tone="neutral">Sistema</Badge>} />
        <CardBody className="grid gap-4 lg:grid-cols-2">
          <IntegrationCard
            title="Supabase"
            status={supabaseUrl && supabaseAnon ? "Conectable" : "Falta configurar"}
            tone={supabaseUrl && supabaseAnon ? "good" : "warn"}
            details={[
              { k: "NEXT_PUBLIC_SUPABASE_URL", ok: !!supabaseUrl },
              { k: "NEXT_PUBLIC_SUPABASE_ANON_KEY", ok: !!supabaseAnon },
            ]}
            cta="Configurar"
          />
          <IntegrationCard
            title="Mercado Libre"
            status="Pendiente"
            tone="warn"
            details={[
              { k: "OAuth (client_id/secret)", ok: false },
              { k: "Refresh token", ok: false },
              { k: "Scopes post-sale/claims", ok: false },
            ]}
            cta="Conectar"
          />
          <IntegrationCard
            title="Mercado Pago"
            status="Pendiente"
            tone="warn"
            details={[
              { k: "Access token", ok: false },
              { k: "Movimientos/conciliación", ok: false },
            ]}
            cta="Conectar"
          />
          <IntegrationCard
            title="Importación CSV"
            status="Disponible"
            tone="good"
            details={[
              { k: "Ventas", ok: true },
              { k: "Gastos", ok: true },
              { k: "Stock", ok: true },
            ]}
            cta="Importar"
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Sync y logs" subtitle="Transparencia total: qué se sincronizó y qué falló (fase 2/3)." />
        <CardBody className="space-y-3">
          <div className="rounded-2xl border border-border bg-panel2/30 p-4 text-sm text-muted">
            En producción, acá ves: última sync, jobs programados, errores por endpoint, reintentos y tiempos. Es clave para confianza.
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => alert("Fase 2: iniciar sync manual / reintentar.")}>Ejecutar sync</Button>
            <Button variant="primary" onClick={() => alert("Fase 2: abrir logs.")}>Ver logs</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function IntegrationCard({
  title,
  status,
  tone,
  details,
  cta,
}: {
  title: string;
  status: string;
  tone: "good" | "warn" | "bad" | "neutral";
  details: Array<{ k: string; ok: boolean }>;
  cta: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-panel2/30 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="mt-1 text-sm text-muted">{status}</div>
        </div>
        <Badge tone={tone}>{tone.toUpperCase()}</Badge>
      </div>
      <div className="mt-3 space-y-2">
        {details.map((d) => (
          <div key={d.k} className="flex items-center justify-between rounded-xl border border-border bg-bg/20 px-3 py-2 text-sm">
            <div className="text-muted">{d.k}</div>
            <Badge tone={d.ok ? "good" : "warn"}>{d.ok ? "OK" : "FALTA"}</Badge>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <Button variant={tone === "good" ? "secondary" : "primary"}>{cta}</Button>
      </div>
    </div>
  );
}
