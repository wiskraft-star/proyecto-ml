export const env = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "PROYECTO ML",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
};

export function envOk() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}
