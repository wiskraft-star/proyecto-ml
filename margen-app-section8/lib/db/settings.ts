import "server-only";

import { supabaseAdmin } from "@/lib/db/client";
import { throwIfSupabaseError } from "@/lib/db/utils";
import { settingsUpsertSchema, sellerIdSchema } from "@/lib/db/validators";
import type { AppSettings } from "@/lib/db/types";

export async function getSettings(seller_id: number): Promise<AppSettings | null> {
  sellerIdSchema.parse(seller_id);
  const admin = supabaseAdmin();

  const { data, error } = await admin
    .schema("app")
    .from("app_settings")
    .select("*")
    .eq("seller_id", seller_id)
    .maybeSingle();

  throwIfSupabaseError(error, "getSettings");
  return data as AppSettings | null;
}

export async function upsertSettings(input: { seller_id: number; ml_site_id?: string }) {
  const parsed = settingsUpsertSchema.parse({
    seller_id: input.seller_id,
    ml_site_id: input.ml_site_id ?? "MLA",
  });

  const admin = supabaseAdmin();

  const { data, error } = await admin
    .schema("app")
    .from("app_settings")
    .upsert(parsed, { onConflict: "seller_id" })
    .select("*")
    .single();

  throwIfSupabaseError(error, "upsertSettings");
  return data as AppSettings;
}

/**
 * Convenience: ensure settings row exists.
 */
export async function ensureSettings(seller_id: number, ml_site_id: string = "MLA") {
  const existing = await getSettings(seller_id);
  if (existing) return existing;
  return upsertSettings({ seller_id, ml_site_id });
}
