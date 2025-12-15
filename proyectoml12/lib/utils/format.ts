import { Prisma } from "@prisma/client";

export function money(n: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);
}

export function toNumberDecimal(d: Prisma.Decimal | null | undefined): number {
  if (!d) return 0;
  return d.toNumber();
}

export function isoDate(d: Date | null | undefined): string {
  if (!d) return "";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(d);
}

export function monthKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function parseMonthParam(month: string | null | undefined): { from: Date; to: Date; key: string } {
  const now = new Date();
  const fallbackKey = monthKey(now);
  const key = month && /^\d{4}-\d{2}$/.test(month) ? month : fallbackKey;
  const [yy, mm] = key.split("-").map((v) => Number(v));
  const from = new Date(yy, mm - 1, 1, 0, 0, 0, 0);
  const to = new Date(yy, mm, 1, 0, 0, 0, 0);
  return { from, to, key };
}
