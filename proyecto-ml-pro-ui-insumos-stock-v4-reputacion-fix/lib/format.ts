export function ars(n: number): string {
  // Simple ARS formatting (es-AR)
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

export function pct(n: number): string {
  return new Intl.NumberFormat("es-AR", { style: "percent", maximumFractionDigits: 1 }).format(n);
}

export function compact(n: number): string {
  return new Intl.NumberFormat("es-AR", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function dateEs(d: string): string {
  // expecting YYYY-MM-DD
  const [y,m,day] = d.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m-1, day));
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short" }).format(dt);
}
