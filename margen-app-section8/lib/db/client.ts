import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Returns an authenticated Supabase client bound to the current user session (RLS applies).
 * Use for user-scoped reads.
 */
export function supabaseUser() {
  return createSupabaseServerClient();
}

/**
 * Returns a Supabase Admin client (Service Role) for server-side CRUD & sync jobs.
 * Bypasses RLS.
 */
export function supabaseAdmin() {
  return createSupabaseAdminClient();
}
