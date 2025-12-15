import type { PostgrestError } from "@supabase/supabase-js";
import { DbError } from "@/lib/db/errors";
import { dbLog } from "@/lib/db/log";

export function throwIfSupabaseError(error: PostgrestError | null, context: string) {
  if (!error) return;
  dbLog.error(`Supabase error in ${context}`, {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  });

  throw new DbError("SUPABASE_ERROR", `Supabase error in ${context}: ${error.message}`, error);
}

export function assertFound<T>(data: T | null | undefined, context: string): T {
  if (data === null || data === undefined) {
    throw new DbError("NOT_FOUND", `Not found: ${context}`);
  }
  return data;
}