import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
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

// Prisma requires DATABASE_URL to exist to parse the datasource.
// If it's missing at build time, provide a safe SQLite default.
if (!originalUrl) {
  process.env.DATABASE_URL = "file:./dev.db";
}

const url = process.env.DATABASE_URL ?? "";
const isPostgres = url.startsWith("postgres://") || url.startsWith("postgresql://");

// Allow forcing a schema via env (useful for CI platforms).
const forcedSchema = process.env.PRISMA_SCHEMA?.trim();

// Vercel sets VERCEL=1. Prefer Postgres schema on Vercel (typical setup),
// but still fall back to what's available.
const preferPostgres = Boolean(process.env.VERCEL) || isPostgres;

let schema = forcedSchema || (preferPostgres ? "prisma_pg/schema.prisma" : "prisma/schema.prisma");

// If the chosen schema doesn't exist (e.g. repo structure changed), fall back.
if (!existsSync(schema)) {
  const alt = schema.includes("prisma_pg") ? "prisma/schema.prisma" : "prisma_pg/schema.prisma";
  if (existsSync(alt)) schema = alt;
}

function run(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

try {
  // 1) Prefer local prisma binary if present.
  const localPrismaBin = join(process.cwd(), "node_modules", ".bin", process.platform === "win32" ? "prisma.cmd" : "prisma");
  if (existsSync(localPrismaBin)) {
    run(`"${localPrismaBin}" generate --schema "${schema}"`);
  } else {
    // 2) Fallback: use npx (allows environments that didn't install dev deps).
    run(`npx prisma generate --schema "${schema}"`);
  }
} catch (err) {
  console.error(`\n[prisma-generate] Failed to generate Prisma Client using schema: ${schema}`);
  console.error("[prisma-generate] If you're on Vercel, ensure DATABASE_URL is set in Project Settings > Environment Variables.");
  throw err;
}
