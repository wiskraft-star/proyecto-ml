"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { NAV, NAV_SECTIONS } from "@/lib/nav";
import { cn } from "@/components/ui/cn";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/components/command-palette";
import { Badge } from "@/components/ui/badge";
import { Menu } from "lucide-react";

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const grouped = useMemo(() => {
    const by: Record<string, typeof NAV> = {};
    NAV_SECTIONS.forEach((s) => (by[s] = []));
    NAV.forEach((item) => by[item.section].push(item));
    return by;
  }, []);

  return (
    <div className="min-h-screen">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-bg/70 px-4 backdrop-blur md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-xl border border-border bg-panel2 p-2 hover:bg-panel2/70"
          aria-label="Abrir menú"
        >
          <Menu size={18} />
        </button>
        <div className="text-sm font-semibold">PROYECTO ML</div>
        <div className="w-10" />
      </div>

      <div className="mx-auto flex w-full max-w-[1440px]">
        {/* Sidebar */}
        <aside
          className={cn(
            "sticky top-0 hidden h-screen shrink-0 border-r border-border bg-bg/70 backdrop-blur md:block",
            collapsed ? "w-[84px]" : "w-[280px]"
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-2xl bg-accent" />
              {!collapsed ? (
                <div className="leading-tight">
                  <div className="text-sm font-semibold">PROYECTO ML</div>
                  <div className="text-xs text-muted">Panel de control</div>
                </div>
              ) : null}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setCollapsed((v) => !v)} aria-label="Colapsar sidebar">
              {collapsed ? "»" : "«"}
            </Button>
          </div>

          <nav className="h-[calc(100%-64px)] overflow-auto p-3">
            {NAV_SECTIONS.map((section) => (
              <div key={section} className="mb-5">
                {!collapsed ? (
                  <div className="px-2 pb-2 text-xs font-semibold tracking-wide text-muted">{section.toUpperCase()}</div>
                ) : (
                  <div className="h-3" />
                )}

                <div className="space-y-1">
                  {grouped[section].map((item) => {
                    const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "group flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm transition",
                          active
                            ? "border-accent/40 bg-panel text-text"
                            : "border-transparent text-muted hover:border-border hover:bg-panel2/60",
                          collapsed ? "justify-center" : ""
                        )}
                      >
                        <Icon size={18} className={cn(active ? "text-accent" : "text-muted group-hover:text-text")} />
                        {!collapsed ? <span className="font-medium">{item.label}</span> : null}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className={cn("mt-6 rounded-2xl border border-border bg-panel2/40 p-3", collapsed && "p-2")}>
              {!collapsed ? (
                <>
                  <div className="text-xs font-semibold">Estado</div>
                  <div className="mt-1 text-xs text-muted">UI PRO activa. Datos: modo demo.</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge tone="good">App: OK</Badge>
                    <Badge tone="warn">Sync: Pendiente</Badge>
                  </div>
                </>
              ) : (
                <div className="text-xs text-muted text-center">●</div>
              )}
            </div>
          </nav>
        </aside>

        {/* Mobile drawer sidebar */}
        {mobileOpen ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <button className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} aria-label="Cerrar" />
            <div className="absolute left-0 top-0 h-full w-[86%] max-w-[340px] border-r border-border bg-bg/90 backdrop-blur">
              <div className="flex h-16 items-center justify-between border-b border-border px-4">
                <div className="text-sm font-semibold">PROYECTO ML</div>
                <Button variant="ghost" size="sm" onClick={() => setMobileOpen(false)}>Cerrar</Button>
              </div>
              <div className="p-3">
                {NAV.map((n) => {
                  const active = n.href === "/" ? pathname === "/" : pathname?.startsWith(n.href);
                  const Icon = n.icon;
                  return (
                    <Link
                      key={n.href}
                      href={n.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "mb-1 flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm",
                        active ? "border-accent/40 bg-panel" : "border-transparent text-muted hover:border-border hover:bg-panel2/60"
                      )}
                    >
                      <Icon size={18} className={active ? "text-accent" : "text-muted"} />
                      <span className="font-medium">{n.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-border bg-bg/70 px-6 backdrop-blur md:flex">
            <div className="flex items-center gap-3">
              <div className="text-sm font-semibold">{titleFromPath(pathname)}</div>
              <Badge tone="neutral">Demo</Badge>
              <Badge tone="good">UI</Badge>
            </div>
            <div className="flex items-center gap-3">
              <CommandPalette />
              <Button variant="secondary" className="hidden lg:inline-flex">Período: Mes</Button>
              <Button variant="primary">Acción</Button>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-5 md:px-6 md:py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

function titleFromPath(pathname: string | null) {
  if (!pathname || pathname === "/") return "Dashboard";
  if (pathname.startsWith("/ventas")) return "Ventas";
  if (pathname.startsWith("/rentabilidad")) return "Rentabilidad";
  if (pathname.startsWith("/gastos")) return "Gastos";
  if (pathname.startsWith("/stock")) return "Stock";
  if (pathname.startsWith("/postventa")) return "Postventa";
  if (pathname.startsWith("/publicaciones")) return "Publicaciones";
  if (pathname.startsWith("/reportes")) return "Reportes";
  if (pathname.startsWith("/integraciones")) return "Integraciones";
  if (pathname.startsWith("/parametros")) return "Parámetros";
  return "Panel";
}
