export function addDays(d: Date, days: number): Date {
  const dt = new Date(d);
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt;
}

export function formatISO(d: Date): string {
  // YYYY-MM-DD
  return d.toISOString().slice(0, 10);
}
