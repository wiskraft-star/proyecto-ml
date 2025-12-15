export type DbErrorCode =
  | "INVALID_INPUT"
  | "SUPABASE_ERROR"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "UNKNOWN";

export class DbError extends Error {
  code: DbErrorCode;
  details?: unknown;

  constructor(code: DbErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "DbError";
    this.code = code;
    this.details = details;
  }
}
