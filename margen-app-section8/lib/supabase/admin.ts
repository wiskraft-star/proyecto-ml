import "server-only";

import { createClient } from "@supabase/supabase-js";
import { envServer, assertServerEnv } from "@/lib/env";

/**
 * Supabase Admin client (Service Role).
 *
 * IMPORTANT:
 * - Only use on the server (this file is server-only).
 * - Bypasses RLS. Treat all input as untrusted.
 */
export function createSupabaseAdminClient() {
  assertServerEnv();

  return createClient(envServer.supabaseUrl, envServer.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        "X-Client-Info": "margen-neto-app/admin",
      },
    },
  });
}
