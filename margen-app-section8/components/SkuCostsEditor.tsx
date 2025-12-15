"use client";

import { useMemo, useState } from "react";
import type { SkuCost } from "@/lib/db/types";

type Row = {
  sku: string;
  unit_cost: string;
  lockedSku?: boolean;
};

function normalizeSku(s: string) {
  return (s ?? "").trim();
}

function parseMoney(input: string): number | null {
  const raw = (input ?? "").trim().replace(/\s/g, "");
  if (!raw) return null;
  const normalized = raw.replace(",", ".");
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function toRow(r: SkuCost): Row {
  return {
    sku: r.sku,
    unit_cost: String(r.unit_cost ?? 0),
    lockedSku: true,
  };
}

function parseCsv(text: string): Array<{ sku: string; unit_cost: string }> {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const out: Array<{ sku: string; unit_cost: string }> = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // support comma or semicolon
    const parts = line.includes(";") ? line.split(";") : line.split(",");
    const a = (parts[0] ?? "").trim();
    const b = (parts[1] ?? "").trim();

    if (i === 0 && a.toLowerCase() === "sku") continue;
    if (!a) continue;

    out.push({ sku: a, unit_cost: b });
  }
  return out;
}

export function SkuCostsEditor({
  sellerId,
  initialRows,
}: {
  sellerId: number;
  initialRows: SkuCost[];
}) {
  const [rows, setRows] = useState<Row[]>(() => initialRows.map(toRow));
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.sku.toLowerCase().includes(q));
  }, [rows, search]);

  async function saveAll() {
    setLoading(true);
    setMsg(null);

    try {
      const payload: Array<{ sku: string; unit_cost: number }> = [];
      const seen = new Set<string>();

      for (const r of rows) {
        const sku = normalizeSku(r.sku);
        if (!sku) continue;

        if (seen.has(sku)) {
          throw new Error(`SKU duplicado en pantalla: ${sku}`);
        }
        seen.add(sku);

        const money = parseMoney(r.unit_cost);
        if (money === null) {
          throw new Error(`Costo inválido para SKU ${sku}`);
        }
        payload.push({ sku, unit_cost: money });
      }

      const resp = await fetch("/api/sku-costs/bulk-upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: payload }),
      });

      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(json?.error || `Error ${resp.status}`);

      const updated: SkuCost[] = Array.isArray(json?.data) ? json.data : [];
      setRows(updated.map(toRow));
      setMsg(`Guardado OK. SKUs: ${updated.length}.`);
    } catch (e: any) {
      setMsg(e?.message ? String(e.message) : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  function addRow() {
    setRows((prev) => [...prev, { sku: "", unit_cost: "0", lockedSku: false }]);
  }

  async function deleteRow(idx: number) {
    setMsg(null);
    const r = rows[idx];
    const sku = normalizeSku(r.sku);

    // if it's a new/empty row, just remove locally
    if (!sku || !r.lockedSku) {
      setRows((prev) => prev.filter((_, i) => i !== idx));
      return;
    }

    if (!confirm(`¿Eliminar SKU ${sku}?`)) return;

    setLoading(true);
    try {
      const resp = await fetch("/api/sku-costs/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku }),
      });

      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(json?.error || `Error ${resp.status}`);

      setRows((prev) => prev.filter((_, i) => i !== idx));
      setMsg(`Eliminado OK: ${sku}`);
    } catch (e: any) {
      setMsg(e?.message ? String(e.message) : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function onImport(file: File) {
    setMsg(null);
    setLoading(true);
    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      if (!parsed.length) throw new Error("CSV vacío o inválido");

      setRows((prev) => {
        const bySku = new Map<string, Row>();
        for (const r of prev) {
          const sku = normalizeSku(r.sku);
          if (!sku) continue;
          bySku.set(sku, { ...r, sku });
        }

        for (const p of parsed) {
          const sku = normalizeSku(p.sku);
          if (!sku) continue;

          const existing = bySku.get(sku);
          const nextRow: Row = {
            sku,
            unit_cost: p.unit_cost ?? "0",
            lockedSku: existing?.lockedSku ?? false,
          };
          bySku.set(sku, nextRow);
        }

        return Array.from(bySku.values()).sort((a, b) => a.sku.localeCompare(b.sku));
      });

      setMsg(`Import OK. Filas leídas: ${parsed.length}. (No guarda hasta presionar Guardar)`);
    } catch (e: any) {
      setMsg(e?.message ? String(e.message) : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    window.location.href = "/api/sku-costs/export";
  }

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <label className="label">Buscar SKU</label>
          <input
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ej: RBLX-25, REDMI14C-256"
          />
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn" onClick={addRow} type="button">
            + Agregar
          </button>
          <button className="btn" onClick={exportCsv} type="button">
            Export CSV
          </button>
          <label className="btn" style={{ cursor: "pointer" }}>
            Import CSV
            <input
              type="file"
              accept=".csv,text/csv,.txt"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onImport(f);
                e.target.value = "";
              }}
            />
          </label>
          <button className="btn btnPrimary" onClick={saveAll} disabled={loading} type="button">
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>

      {msg ? <p className="small" style={{ marginTop: 10 }}>
        {msg}
      </p> : null}

      <div className="tableWrap" style={{ marginTop: 12 }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 260 }}>SKU</th>
              <th style={{ width: 180 }}>Costo unitario</th>
              <th>Notas</th>
              <th style={{ width: 120 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const idx = rows.indexOf(r);
              return (
                <tr key={`${r.sku}-${idx}`}>
                  <td>
                    <input
                      className="input mono"
                      value={r.sku}
                      disabled={r.lockedSku}
                      onChange={(e) => {
                        const v = e.target.value;
                        setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, sku: v } : x)));
                      }}
                      placeholder="SKU"
                    />
                  </td>
                  <td>
                    <input
                      className="input mono"
                      value={r.unit_cost}
                      onChange={(e) => {
                        const v = e.target.value;
                        setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, unit_cost: v } : x)));
                      }}
                      placeholder="0"
                    />
                  </td>
                  <td className="small">
                    {r.lockedSku ? "Existente" : "Nuevo"} · seller_id {sellerId}
                  </td>
                  <td>
                    <button className="btn btnDanger" type="button" onClick={() => void deleteRow(idx)} disabled={loading}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              );
            })}
            {!filtered.length ? (
              <tr>
                <td colSpan={4} className="small">
                  Sin filas.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="small" style={{ marginTop: 10 }}>
        CSV esperado: <span className="mono">sku,unit_cost</span> (también acepta <span className="mono">;</span>). El import solo carga en pantalla;
        para persistir, presioná <strong>Guardar</strong>.
      </p>
    </div>
  );
}
