"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
import { ars, pct, compact } from "@/lib/format";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function KpiCard({
  label,
  value,
  deltaPct,
  tone = "neutral",
  format = "ars",
  onClick,
  hint,
}: {
  label: string;
  value: number;
  deltaPct?: number;
  tone?: "neutral" | "good" | "warn" | "bad";
  format?: "ars" | "pct" | "compact" | "raw";
  onClick?: () => void;
  hint?: string;
}) {
  const toneClasses = {
    neutral: "border-border",
    good: "border-good/30",
    warn: "border-warn/30",
    bad: "border-bad/30",
  } as const;

  const showDelta = typeof deltaPct === "number" && !Number.isNaN(deltaPct);
  const up = (deltaPct ?? 0) >= 0;
  const DeltaIcon = up ? ArrowUpRight : ArrowDownRight;

  const fmtValue = (v: number) => {
    if (format === "ars") return ars(v);
    if (format === "pct") return pct(v);
    if (format === "compact") return compact(v);
    return String(v);
  };

  return (
    <Card className={cn("cursor-pointer select-none p-4 transition hover:bg-panel2/40", toneClasses[tone])} >
      <button onClick={onClick} className="w-full text-left">
        <div className="text-xs text-muted">{label}</div>
        <div className="mt-2 text-2xl font-semibold tracking-tight">{fmtValue(value)}</div>
        <div className="mt-2 flex items-center justify-between gap-3">
          {showDelta ? (
            <div className={cn("inline-flex items-center gap-1 text-xs",
              tone === "good" ? "text-good" : tone === "warn" ? "text-warn" : tone === "bad" ? "text-bad" : "text-muted"
            )}>
              <DeltaIcon size={14} />
              {pct(Math.abs(deltaPct ?? 0))}
              <span className="text-muted">vs período anterior</span>
            </div>
          ) : <div className="text-xs text-muted"> </div>}
          {hint ? <div className="text-xs text-muted line-clamp-1">{hint}</div> : null}
        </div>
      </button>
    </Card>
  );
}
