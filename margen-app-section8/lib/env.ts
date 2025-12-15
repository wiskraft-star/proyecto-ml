/**
 * Public (browser-safe) env vars.
 * These MUST be prefixed with NEXT_PUBLIC_.
 */
export const envPublic = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
};

/**
 * Server-only env vars (never expose to the client).
 */
export const envServer = {
  // Prefer explicit SUPABASE_URL, but fall back to NEXT_PUBLIC_SUPABASE_URL if needed.
  supabaseUrl: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",

  // Mercado Libre / Mercado Pago (server-only)
  mlSiteId: process.env.ML_SITE_ID ?? "MLA",
  mlSellerId: process.env.ML_SELLER_ID ?? "",
  mlClientId: process.env.ML_CLIENT_ID ?? "",
  mlClientSecret: process.env.ML_CLIENT_SECRET ?? "",
  mlRefreshToken: process.env.ML_REFRESH_TOKEN ?? "",
  mpAccessToken: process.env.MP_ACCESS_TOKEN ?? "",
};

export function assertPublicEnv() {
  const missing: string[] = [];
  if (!envPublic.supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!envPublic.supabaseAnonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (missing.length) throw new Error(`Missing required env vars: ${missing.join(", ")}`);
}

export function assertServerEnv() {
  const missing: string[] = [];
  if (!envServer.supabaseUrl) missing.push("SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)");
  if (!envServer.supabaseServiceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (missing.length) throw new Error(`Missing required server env vars: ${missing.join(", ")}`);
}

export function assertMlEnv() {
  const missing: string[] = [];
  if (!envServer.mlSellerId) missing.push("ML_SELLER_ID");
  if (!envServer.mlClientId) missing.push("ML_CLIENT_ID");
  if (!envServer.mlClientSecret) missing.push("ML_CLIENT_SECRET");
  if (!envServer.mlRefreshToken) missing.push("ML_REFRESH_TOKEN");
  if (!envServer.mlSiteId) missing.push("ML_SITE_ID");
  if (missing.length) throw new Error(`Missing required ML env vars: ${missing.join(", ")}`);
}

export function assertMpEnv() {
  const missing: string[] = [];
  if (!envServer.mpAccessToken) missing.push("MP_ACCESS_TOKEN");
  if (missing.length) throw new Error(`Missing required MP env vars: ${missing.join(", ")}`);
}
