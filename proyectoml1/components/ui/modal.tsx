"use client";

import { useEffect } from "react";
import { cn } from "./cn";

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Cerrar" />
      <div className={cn("relative w-full max-w-xl rounded-2xl border border-border bg-panel shadow-soft", className)}>
        {title ? <div className="border-b border-border px-5 py-4 text-sm font-semibold">{title}</div> : null}
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
