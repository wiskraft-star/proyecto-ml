"use client";

import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import type { ActionItem } from "@/lib/mock";

export function ActionsPanel({ items, onPick }: { items: ActionItem[]; onPick: (id: string) => void }) {
  return (
    <Card>
      <CardHeader title="Acciones prioritarias" subtitle="Lo que conviene atender hoy para proteger margen y reputación." right={<Badge tone="warn">Prioridad</Badge>} />
      <CardBody className="space-y-3">
        {items.map((a) => (
          <div key={a.id} className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-panel2/30 p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Badge tone={a.tone === "neutral" ? "neutral" : a.tone}>{a.tone === "neutral" ? "Info" : a.tone.toUpperCase()}</Badge>
                <div className="text-sm font-semibold">{a.title}</div>
              </div>
              <div className="mt-2 text-sm text-muted">{a.detail}</div>
            </div>
            <div className="shrink-0">
              <Button variant={a.tone === "bad" ? "danger" : "secondary"} onClick={() => onPick(a.id)}>
                {a.cta}
              </Button>
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
