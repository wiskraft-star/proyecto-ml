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

export function dateEs(d: string | Date): string {
  // Accepts either a Date object or an ISO-like string (e.g. YYYY-MM-DD).
  let dt: Date;

  if (typeof d === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      const [y, m, day] = d.split("-").map(Number);
      dt = new Date(Date.UTC(y, m - 1, day));
    } else {
      dt = new Date(d);
    }
  } else {
    dt = d;
  }

  if (Number.isNaN(dt.getTime())) return String(d);

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
  }).format(dt);
}

