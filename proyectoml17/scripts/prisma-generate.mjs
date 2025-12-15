import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Generate Prisma Client before Next.js build/typecheck.
 *
 * Design goals:
 * - Never fail during `npm install` (we no longer run in postinstall).
 * - Be robust on Vercel where env var availability can vary.
 * - Prefer local prisma binary; fall back to `npx prisma` if needed.
 */

const originalUrl = process.env.DATABASE_URL ?? "";
const url = originalUrl;
const hasDbUrl = Boolean(url);
const urlLooksPostgres = url.startsWith("postgres://") || url.startsWith("postgresql://");

// Allow forcing a schema via env (useful for CI platforms).
const forcedSchema = process.env.PRISMA_SCHEMA?.trim();

// Decide schema deterministically:
// - If DATABASE_URL is present, follow it.
// - If not present, on Vercel default to Postgres schema (typical), otherwise SQLite.
let schema =
  forcedSchema ||
  (hasDbUrl ? (urlLooksPostgres ? "prisma_pg/schema.prisma" : "prisma/schema.prisma") : process.env.VERCEL ? "prisma_pg/schema.prisma" : "prisma/schema.prisma");

// If the chosen schema doesn't exist (e.g. repo structure changed), fall back.
if (!existsSync(schema)) {
  const alt = schema.includes("prisma_pg") ? "prisma/schema.prisma" : "prisma_pg/schema.prisma";
  if (existsSync(alt)) schema = alt;
}

// Ensure DATABASE_URL exists and matches the chosen schema provider.
// Prisma generate does NOT need a live connection, but it does validate URL shape.
if (!hasDbUrl) {
  const schemaText = readFileSync(schema, "utf8");
  const isSchemaPostgres = schemaText.includes('provider = "postgresql"');
  process.env.DATABASE_URL = isSchemaPostgres
    ? "postgresql://user:pass@localhost:5432/db?schema=public"
    : "file:./dev.db";
}

function run(bin, args) {
  console.log(`[prisma-generate] Running: ${bin} ${args.join(" ")}`);
  const res = spawnSync(bin, args, {
    stdio: "inherit",
    env: {
      ...process.env,
      PRISMA_HIDE_UPDATE_MESSAGE: "1",
    },
  });

  if (res.error) throw res.error;
  if (typeof res.status === "number" && res.status !== 0) {
    const err = new Error(`[prisma-generate] Command failed with exit code ${res.status}`);
    // @ts-ignore
    err.code = res.status;
    throw err;
  }
}

try {
  // 1) Prefer local prisma binary if present.
  const localPrismaBin = join(process.cwd(), "node_modules", ".bin", process.platform === "win32" ? "prisma.cmd" : "prisma");
  if (existsSync(localPrismaBin)) {
    run(localPrismaBin, ["generate", "--schema", schema, "--log-level", "info"]);
  } else {
    // 2) Fallback: use npx (allows environments that didn't install dev deps).
    run("npx", ["prisma", "generate", "--schema", schema, "--log-level", "info"]);
  }
} catch (err) {
  console.error(`\n[prisma-generate] Failed to generate Prisma Client using schema: ${schema}`);
  console.error("[prisma-generate] If you're on Vercel, ensure DATABASE_URL is set in Project Settings > Environment Variables.");
  throw err;
}
