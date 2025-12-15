import { createBrowserClient } from "@supabase/ssr";
import { envPublic, assertPublicEnv } from "@/lib/env";

export function createSupabaseBrowserClient() {
  assertPublicEnv();
  return createBrowserClient(envPublic.supabaseUrl, envPublic.supabaseAnonKey);
}
