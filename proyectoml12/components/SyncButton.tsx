"use client";

import { useState } from "react";

type Props = {
  endpoint: string;
  label: string;
  month: string;
  onDone?: () => void;
};

export function SyncButton({ endpoint, label, month, onDone }: Props): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run(): Promise<void> {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month }),
      });
      const data = (await res.json()) as { ok?: boolean; upserted?: number; unlinked?: number; error?: string };
      if (!res.ok || data.ok === false) {
        setMsg(data.error ?? `Error HTTP ${res.status}`);
      } else {
        const extra = typeof data.unlinked === "number" ? ` | sin link: ${data.unlinked}` : "";
        setMsg(`OK | upserted: ${data.upserted ?? 0}${extra}`);
        onDone?.();
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={run}
        disabled={loading}
        className="px-3 py-2 rounded-lg bg-zinc-900 text-white text-sm disabled:opacity-50"
      >
        {loading ? "Sincronizando..." : label}
      </button>
      {msg ? <div className="text-xs text-zinc-600">{msg}</div> : null}
    </div>
  );
}
