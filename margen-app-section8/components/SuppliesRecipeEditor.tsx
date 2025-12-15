"use client";

import { useMemo, useState } from "react";
import type { Supply, SupplyRecipeLine } from "@/lib/db/types";

type SupplyRow = {
  id?: string;
  name: string;
  unit_cost: string;
  lockedName?: boolean;
};

type RecipeRow = {
  id?: string;
  supply_id: string;
  qty_per_sale: string;
};

function normalizeName(s: string) {
  return (s ?? "").trim();
}

function parseNumber(input: string): number | null {
  const raw = (input ?? "").trim().replace(/\s/g, "");
  if (!raw) return null;
  const normalized = raw.replace(",", ".");
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function toSupplyRow(s: Supply): SupplyRow {
  return {
    id: s.id,
    name: s.name,
    unit_cost: String(s.unit_cost ?? 0),
    lockedName: true,
  };
}

function toRecipeRow(r: SupplyRecipeLine): RecipeRow {
  return {
    id: r.id,
    supply_id: r.supply_id,
    qty_per_sale: String(r.qty_per_sale ?? 0),
  };
}

export function SuppliesRecipeEditor({
  sellerId,
  initialSupplies,
  initialRecipeLines,
}: {
  sellerId: number;
  initialSupplies: Supply[];
  initialRecipeLines: SupplyRecipeLine[];
}) {
  const [supplies, setSupplies] = useState<SupplyRow[]>(() => initialSupplies.map(toSupplyRow));
  const [recipe, setRecipe] = useState<RecipeRow[]>(() => initialRecipeLines.map(toRecipeRow));
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const suppliesById = useMemo(() => {
    const m = new Map<string, SupplyRow>();
    for (const s of supplies) {
      if (s.id) m.set(s.id, s);
    }
    return m;
  }, [supplies]);

  const recipeCostPerSale = useMemo(() => {
    let total = 0;
    for (const line of recipe) {
      const s = suppliesById.get(line.supply_id);
      if (!s) continue;
      const qty = parseNumber(line.qty_per_sale);
      const cost = parseNumber(s.unit_cost);
      if (qty === null || cost === null) continue;
      total += qty * cost;
    }
    return total;
  }, [recipe, suppliesById]);

  const recipeBreakdown = useMemo(() => {
    const out: Array<{ supply_id: string; name: string; qty: number; unit: number; subtotal: number }> = [];
    for (const line of recipe) {
      const s = suppliesById.get(line.supply_id);
      if (!s) continue;
      const qty = parseNumber(line.qty_per_sale);
      const unit = parseNumber(s.unit_cost);
      if (qty === null || unit === null) continue;
      out.push({ supply_id: line.supply_id, name: s.name, qty, unit, subtotal: qty * unit });
    }
    out.sort((a, b) => b.subtotal - a.subtotal);
    return out;
  }, [recipe, suppliesById]);

  async function refreshSupplies() {
    const resp = await fetch("/api/supplies/list", { method: "GET" });
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(json?.error || `Error ${resp.status}`);
    const rows: Supply[] = Array.isArray(json?.data) ? json.data : [];
    setSupplies(rows.map(toSupplyRow));
  }

  async function refreshRecipe() {
    const resp = await fetch("/api/recipe-lines/list", { method: "GET" });
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(json?.error || `Error ${resp.status}`);
    const rows: SupplyRecipeLine[] = Array.isArray(json?.data) ? json.data : [];
    setRecipe(rows.map(toRecipeRow));
  }

  async function addSupply() {
    setMsg(null);
    const name = normalizeName(prompt("Nombre del insumo (ej: Burbuja, Cinta, Bolsa)") || "");
    if (!name) return;

    const unit_cost_raw = prompt("Costo unitario (ARS)", "0") || "0";
    const unit_cost = parseNumber(unit_cost_raw);
    if (unit_cost === null) {
      setMsg("Costo inválido.");
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch("/api/supplies/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, unit_cost }),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(json?.error || `Error ${resp.status}`);
      await refreshSupplies();
      setMsg(`Insumo guardado: ${name}`);
    } catch (e: any) {
      setMsg(e?.message ? String(e.message) : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function saveSupply(idx: number) {
    setMsg(null);
    const row = supplies[idx];
    const name = normalizeName(row.name);
    const unit_cost = parseNumber(row.unit_cost);
    if (!name) {
      setMsg("Nombre vacío.");
      return;
    }
    if (unit_cost === null) {
      setMsg("Costo inválido.");
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch("/api/supplies/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, unit_cost }),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(json?.error || `Error ${resp.status}`);
      await refreshSupplies();
      setMsg(`Guardado OK: ${name}`);
    } catch (e: any) {
      setMsg(e?.message ? String(e.message) : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function deleteSupply(idx: number) {
    setMsg(null);
    const row = supplies[idx];
    if (!row.id) {
      setSupplies((prev) => prev.filter((_, i) => i !== idx));
      return;
    }
    if (!confirm(`¿Eliminar insumo "${row.name}"? (También borra su receta)`)) return;

    setLoading(true);
    try {
      const resp = await fetch("/api/supplies/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id }),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(json?.error || `Error ${resp.status}`);

      // Cascade en DB; refrescamos ambas listas.
      await refreshSupplies();
      await refreshRecipe();
      setMsg(`Eliminado OK: ${row.name}`);
    } catch (e: any) {
      setMsg(e?.message ? String(e.message) : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  function addRecipeLine() {
    const first = supplies.find((s) => s.id)?.id;
    if (!first) {
      setMsg("Primero cargá al menos 1 insumo.");
      return;
    }
    setRecipe((prev) => [...prev, { supply_id: first, qty_per_sale: "0" }]);
  }

  async function saveRecipeLine(idx: number) {
    setMsg(null);
    const row = recipe[idx];
    const supply_id = row.supply_id;
    if (!supply_id) {
      setMsg("Seleccioná un insumo.");
      return;
    }
    const qty = parseNumber(row.qty_per_sale);
    if (qty === null) {
      setMsg("Cantidad por venta inválida.");
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch("/api/recipe-lines/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supply_id, qty_per_sale: qty }),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(json?.error || `Error ${resp.status}`);
      await refreshRecipe();
      setMsg("Receta guardada.");
    } catch (e: any) {
      setMsg(e?.message ? String(e.message) : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function deleteRecipeLine(idx: number) {
    setMsg(null);
    const row = recipe[idx];
    if (!row.id) {
      setRecipe((prev) => prev.filter((_, i) => i !== idx));
      return;
    }
    if (!confirm("¿Eliminar esta línea de receta?") ) return;

    setLoading(true);
    try {
      const resp = await fetch("/api/recipe-lines/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id }),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(json?.error || `Error ${resp.status}`);
      await refreshRecipe();
      setMsg("Línea eliminada.");
    } catch (e: any) {
      setMsg(e?.message ? String(e.message) : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div className="h2">Costo de insumos por venta</div>
          <div className="small">
            Total (receta global): <strong>{recipeCostPerSale.toFixed(2)}</strong> ARS
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn" type="button" onClick={addSupply} disabled={loading}>
            + Agregar insumo
          </button>
          <button className="btn" type="button" onClick={addRecipeLine} disabled={loading}>
            + Agregar línea receta
          </button>
        </div>
      </div>

      {msg ? (
        <p className="small" style={{ marginTop: 10 }}>
          {msg}
        </p>
      ) : null}

      <div className="grid2" style={{ marginTop: 12 }}>
        <div className="card">
          <div className="h2">Insumos</div>
          <div className="small">CRUD sobre <span className="mono">app.supplies</span></div>

          <div className="tableWrap" style={{ marginTop: 12 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th style={{ width: 170 }}>Costo unitario</th>
                  <th style={{ width: 170 }}></th>
                </tr>
              </thead>
              <tbody>
                {supplies.map((s, idx) => (
                  <tr key={s.id ?? `new-${idx}`}>
                    <td>
                      <input
                        className="input"
                        value={s.name}
                        disabled={s.lockedName}
                        onChange={(e) => {
                          const v = e.target.value;
                          setSupplies((prev) => prev.map((x, i) => (i === idx ? { ...x, name: v } : x)));
                        }}
                        placeholder="Nombre"
                      />
                      {s.lockedName ? (
                        <div className="small">(Nombre bloqueado; si querés renombrar, eliminá y volvé a crear.)</div>
                      ) : null}
                    </td>
                    <td>
                      <input
                        className="input mono"
                        value={s.unit_cost}
                        onChange={(e) => {
                          const v = e.target.value;
                          setSupplies((prev) => prev.map((x, i) => (i === idx ? { ...x, unit_cost: v } : x)));
                        }}
                        placeholder="0"
                      />
                    </td>
                    <td>
                      <div className="row" style={{ gap: 8 }}>
                        <button className="btn btnPrimary" type="button" onClick={() => void saveSupply(idx)} disabled={loading}>
                          Guardar
                        </button>
                        <button className="btn btnDanger" type="button" onClick={() => void deleteSupply(idx)} disabled={loading}>
                          Eliminar
                        </button>
                      </div>
                      <div className="small">seller_id {sellerId}</div>
                    </td>
                  </tr>
                ))}
                {!supplies.length ? (
                  <tr>
                    <td colSpan={3} className="small">
                      Sin insumos. Agregá el primero.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="h2">Receta global (qty_per_sale)</div>
          <div className="small">CRUD sobre <span className="mono">app.supply_recipe_lines</span></div>

          <div className="tableWrap" style={{ marginTop: 12 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Insumo</th>
                  <th style={{ width: 200 }}>Cantidad por venta</th>
                  <th style={{ width: 170 }}></th>
                </tr>
              </thead>
              <tbody>
                {recipe.map((r, idx) => (
                  <tr key={r.id ?? `new-r-${idx}`}>
                    <td>
                      <select
                        className="input"
                        value={r.supply_id}
                        onChange={(e) => {
                          const v = e.target.value;
                          setRecipe((prev) => prev.map((x, i) => (i === idx ? { ...x, supply_id: v } : x)));
                        }}
                      >
                        {supplies
                          .filter((s) => s.id)
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                      </select>
                    </td>
                    <td>
                      <input
                        className="input mono"
                        value={r.qty_per_sale}
                        onChange={(e) => {
                          const v = e.target.value;
                          setRecipe((prev) => prev.map((x, i) => (i === idx ? { ...x, qty_per_sale: v } : x)));
                        }}
                        placeholder="0"
                      />
                    </td>
                    <td>
                      <div className="row" style={{ gap: 8 }}>
                        <button className="btn btnPrimary" type="button" onClick={() => void saveRecipeLine(idx)} disabled={loading}>
                          Guardar
                        </button>
                        <button className="btn btnDanger" type="button" onClick={() => void deleteRecipeLine(idx)} disabled={loading}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!recipe.length ? (
                  <tr>
                    <td colSpan={3} className="small">
                      Sin receta. Agregá una línea.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <div className="h2">Desglose</div>
            <div className="tableWrap" style={{ marginTop: 8 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Insumo</th>
                    <th style={{ width: 140 }}>Qty</th>
                    <th style={{ width: 140 }}>Unit</th>
                    <th style={{ width: 160 }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {recipeBreakdown.map((b) => (
                    <tr key={b.supply_id}>
                      <td>{b.name}</td>
                      <td className="mono">{b.qty}</td>
                      <td className="mono">{b.unit.toFixed(2)}</td>
                      <td className="mono">{b.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                  {!recipeBreakdown.length ? (
                    <tr>
                      <td colSpan={4} className="small">
                        Sin datos para mostrar.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
