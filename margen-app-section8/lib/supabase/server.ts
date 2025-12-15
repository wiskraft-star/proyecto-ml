import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { envPublic, assertPublicEnv } from "@/lib/env";

/**
 * Server Component client (read-only cookies; session refresh happens in middleware).
 */
export function createSupabaseServerClient() {
  assertPublicEnv();
  const cookieStore = cookies();

  return createServerClient(envPublic.supabaseUrl, envPublic.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      // In Server Components we cannot set cookies; middleware does the refresh.
      setAll() {},
    },
  });
}
