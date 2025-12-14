"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "./ui/modal";
import { Input } from "./ui/input";
import { NAV } from "@/lib/nav";
import { Badge } from "./ui/badge";

type Action = { id: string; label: string; hint: string; href: string; section: string };

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();

  const actions: Action[] = useMemo(() => {
    const nav = NAV.map((n) => ({
      id: n.href,
      label: n.label,
      hint: `Ir a ${n.label}`,
      href: n.href,
      section: n.section,
    }));
    return nav;
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return actions;
    return actions.filter((a) => (a.label + " " + a.section).toLowerCase().includes(qq));
  }, [q, actions]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isK = e.key.toLowerCase() === "k";
      const meta = e.metaKey || e.ctrlKey;
      if (meta && isK) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 rounded-xl border border-border bg-panel2 px-3 py-2 text-sm text-muted hover:bg-panel2/70"
        aria-label="Buscar (Cmd+K)"
      >
        Buscar…
        <span className="ml-2 rounded-lg border border-border px-2 py-0.5 text-xs">⌘K</span>
      </button>

      <Modal open={open} onClose={() => { setOpen(false); setQ(""); }} title="Buscar">
        <div className="space-y-3">
          <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Escribí para navegar…" />
          <div className="max-h-[360px] overflow-auto rounded-2xl border border-border">
            {filtered.map((a) => (
              <button
                key={a.id}
                onClick={() => { router.push(a.href); setOpen(false); setQ(""); }}
                className="flex w-full items-center justify-between gap-3 border-t border-border px-4 py-3 text-left hover:bg-panel2/60"
              >
                <div>
                  <div className="text-sm font-medium">{a.label}</div>
                  <div className="mt-0.5 text-xs text-muted">{a.hint}</div>
                </div>
                <Badge>{a.section}</Badge>
              </button>
            ))}
            {!filtered.length ? (
              <div className="px-4 py-8 text-sm text-muted">Sin resultados.</div>
            ) : null}
          </div>
          <div className="text-xs text-muted">Atajo: ⌘K / Ctrl+K. Esc para cerrar.</div>
        </div>
      </Modal>
    </>
  );
}
