"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui/cn";

const TABS = [
  { href: "/margen/metricas", label: "Métricas" },
  { href: "/margen/ventas", label: "Ventas" },
  { href: "/margen/cobros", label: "Cobros" },
  { href: "/margen/cogs", label: "Stock/Costos" },
  { href: "/margen/insumos", label: "Insumos" },
  { href: "/margen/mano-obra", label: "Mano de obra" },
] as const;

export function MargenTabs() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "rounded-2xl border px-3 py-2 text-sm transition",
              active ? "border-accent/40 bg-panel text-text" : "border-border bg-panel2/40 text-muted hover:bg-panel2/60"
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
