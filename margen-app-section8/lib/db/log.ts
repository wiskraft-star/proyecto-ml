type LogLevel = "debug" | "info" | "warn" | "error";

function shouldLog(level: LogLevel) {
  // Keep it simple: always log warn/error; allow debug/info in dev.
  if (level === "warn" || level === "error") return true;
  return process.env.NODE_ENV !== "production";
}

function print(level: LogLevel, message: string, meta?: unknown) {
  if (!shouldLog(level)) return;
  const prefix = "[db]";
  if (meta === undefined) {
    // eslint-disable-next-line no-console
    console[level](`${prefix} ${message}`);
  } else {
    // eslint-disable-next-line no-console
    console[level](`${prefix} ${message}`, meta);
  }
}

export const dbLog = {
  debug(message: string, meta?: unknown) {
    print("debug", message, meta);
  },
  info(message: string, meta?: unknown) {
    print("info", message, meta);
  },
  warn(message: string, meta?: unknown) {
    print("warn", message, meta);
  },
  error(message: string, meta?: unknown) {
    print("error", message, meta);
  },
};
