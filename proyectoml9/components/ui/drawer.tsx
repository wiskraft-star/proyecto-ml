"use client";

import { useEffect } from "react";
import { cn } from "./cn";
import { X } from "lucide-react";

export function Drawer({
  open,
  onClose,
  title,
  children,
  width = "max-w-xl",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Cerrar" />
      <aside className={cn("absolute right-0 top-0 h-full w-full border-l border-border bg-panel shadow-soft", width)}>
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <div className="text-sm font-semibold">{title}</div>
          <button
            onClick={onClose}
            className="rounded-xl border border-border bg-panel2 p-2 hover:bg-panel2/70"
            aria-label="Cerrar drawer"
          >
            <X size={16} />
          </button>
        </div>
        <div className="h-[calc(100%-64px)] overflow-auto px-5 py-4">{children}</div>
      </aside>
    </div>
  );
}
