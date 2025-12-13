"use client";

import { SideNav } from "./nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { env, envOk } from "@/lib/env";
import { useMemo } from "react";
import { CircleCheck, CircleX, Github } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const ok = useMemo(() => envOk(), []);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex w-full max-w-[1280px] gap-6 px-4 py-6">
        <aside className="hidden w-64 shrink-0 rounded-2xl border border-zinc-200 bg-white p-4 shadow-soft md:block">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-zinc-900">{env.appName}</div>
              <div className="mt-0.5 text-xs text-zinc-500">Panel de control</div>
            </div>
            <Badge className={ok ? "text-emerald-700 border-emerald-200" : "text-rose-700 border-rose-200"}>
              {ok ? (
                <span className="inline-flex items-center gap-1">
                  <CircleCheck className="h-3.5 w-3.5" /> env OK
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <CircleX className="h-3.5 w-3.5" /> falta env
                </span>
              )}
            </Badge>
          </div>

          <div className="my-4 h-px bg-zinc-100" />
          <SideNav />

          <div className="my-4 h-px bg-zinc-100" />
          <div className="space-y-2">
            <div className="text-xs font-medium text-zinc-600">Accesos</div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" href="https://vercel.com/dashboard" target="_blank">
                Vercel
              </Button>
              <Button variant="secondary" href="https://supabase.com/dashboard" target="_blank">
                Supabase
              </Button>
              <Button variant="secondary" href="https://github.com" target="_blank" className="gap-2">
                <Github className="h-4 w-4" /> GitHub
              </Button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-6 flex items-start justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-soft">
            <div>
              <div className="text-sm font-semibold text-zinc-900">{env.appName}</div>
              <div className="mt-0.5 text-xs text-zinc-500">
                Interfaz PRO primero, luego conectamos datos (Supabase / Mercado Libre).
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={ok ? "text-emerald-700 border-emerald-200" : "text-rose-700 border-rose-200"}>
                {ok ? "Supabase: env OK" : "Supabase: falta env"}
              </Badge>
              <Button variant="ghost" href="/parametros">
                Ajustes
              </Button>
            </div>
          </div>

          {children}
        </main>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-200 bg-white p-2 shadow-soft md:hidden">
        <div className="mx-auto flex max-w-[900px] items-center justify-between gap-2 px-2">
          <Button variant="secondary" href="/">
            Dashboard
          </Button>
          <Button variant="secondary" href="/ventas">
            Ventas
          </Button>
          <Button variant="secondary" href="/gastos">
            Gastos
          </Button>
          <Button variant="secondary" href="/stock">
            Stock
          </Button>
          <Button variant="secondary" href="/parametros">
            Parám.
          </Button>
        </div>
      </div>
    </div>
  );
}
