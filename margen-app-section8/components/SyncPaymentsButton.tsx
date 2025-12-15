"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SyncPaymentsButton({ days = 30 }: { days?: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setMsg(null);
    try {
      const resp = await fetch("/api/mp/sync-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });

      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(json?.error || `Error ${resp.status}`);

      const ecount = Array.isArray(json?.errors) ? json.errors.length : 0;
      setMsg(
        `Sync OK. Pagos: ${json?.fetched_payments ?? "?"}. Guardados: ${json?.payments_upserted ?? "?"}. Errores: ${ecount}.`
      );
      router.refresh();
    } catch (e: any) {
      setMsg(e?.message ? String(e.message) : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="row" style={{ justifyContent: "space-between" }}>
      <button className="btn btnPrimary" onClick={onClick} disabled={loading}>
        {loading ? "Sincronizando..." : `Sync Cobros (últimos ${days} días)`}
      </button>
      {msg ? <span className="small">{msg}</span> : null}
    </div>
  );
}
