"use client";

import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function ParametrosPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Parámetros" subtitle="La realidad del negocio: costos, reglas e impuestos. (modo demo)" right={<Badge tone="neutral">Config</Badge>} />
        <CardBody className="grid gap-6 lg:grid-cols-2">
          <Section title="Costos por unidad">
            <Field label="Embalaje (ARS / unidad)">
              <Input defaultValue="200" />
            </Field>
            <Field label="Mano de obra (ARS / unidad)">
              <Input defaultValue="400" />
            </Field>
            <Field label="Costo variable extra (ARS / unidad)">
              <Input defaultValue="0" />
            </Field>
          </Section>

          <Section title="Impuestos">
            <Field label="Modo IVA">
              <Select defaultValue="real">
                <option value="real">Real (cargado)</option>
                <option value="estimado">Estimado</option>
              </Select>
            </Field>
            <Field label="Modo IIBB">
              <Select defaultValue="real">
                <option value="real">Real (cargado)</option>
                <option value="estimado">Estimado</option>
              </Select>
            </Field>
            <Field label="Incluir impuestos en neto">
              <Select defaultValue="si">
                <option value="si">Sí</option>
                <option value="no">No</option>
              </Select>
            </Field>
          </Section>

          <Section title="Reglas de devoluciones">
            <Field label="Detectar “envío negativo” como costo">
              <Select defaultValue="si">
                <option value="si">Sí</option>
                <option value="no">No</option>
              </Select>
            </Field>
            <Field label="Imputación por motivo">
              <Select defaultValue="simple">
                <option value="simple">Simple</option>
                <option value="avanzada">Avanzada (mi culpa / comprador / sin motivo)</option>
              </Select>
            </Field>
          </Section>

          <Section title="Alertas (gestión)">
            <Field label="Margen neto mínimo esperado (%)">
              <Input defaultValue="15" />
            </Field>
            <Field label="Stock crítico (días cobertura)">
              <Input defaultValue="7" />
            </Field>
            <Field label="Tasa máxima devoluciones (%)">
              <Input defaultValue="3" />
            </Field>
          </Section>

          <div className="lg:col-span-2 flex items-center gap-2">
            <Button variant="primary" onClick={() => alert("Fase 2: guardar en Supabase y recalcular vistas.")}>Guardar</Button>
            <Button variant="secondary" onClick={() => alert("Fase 2: restaurar valores por defecto.")}>Restaurar</Button>
            <div className="text-sm text-muted">Estos valores definen cómo se calcula el neto y las alertas.</div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Nota importante" subtitle="Por qué existe Parámetros y no se mezcla con operación." />
        <CardBody className="text-sm text-muted">
          Parámetros concentra la “verdad configurable” (costos, reglas, modos de impuestos, umbrales). Esto evita tocar fórmulas o lógica
          en cada pantalla y permite que el sistema sea auditable y consistente.
        </CardBody>
      </Card>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-panel2/30 p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{title}</div>
        <Badge tone="neutral">Editable</Badge>
      </div>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold text-muted">{label}</div>
      {children}
    </div>
  );
}
