import { execSync } from "node:child_process";

/**
 * Generate Prisma Client before Next.js build/typecheck.
 *
 * IMPORTANT:
 * - We DO NOT run this at postinstall because some platforms (e.g. Vercel) may
 *   not expose build-time environment variables during the install step.
 * - Prisma requires DATABASE_URL to be defined to parse the datasource, even for `generate`.
 *
 * This project supports:
 * - Dev: SQLite schema at prisma/schema.prisma
 * - Prod: Postgres schema at prisma_pg/schema.prisma
 */

const originalUrl = process.env.DATABASE_URL ?? "";

// If DATABASE_URL is missing, provide a safe SQLite default so `prisma generate` can run.
// This keeps `npm run build` working even if the user forgot to set env vars locally.
if (!originalUrl) {
  process.env.DATABASE_URL = "file:./dev.db";
}

const url = process.env.DATABASE_URL ?? "";
const isPostgres = url.startsWith("postgres://") || url.startsWith("postgresql://");
const schema = isPostgres ? "prisma_pg/schema.prisma" : "prisma/schema.prisma";

try {
  execSync(`npx prisma generate --schema ${schema}`, { stdio: "inherit" });
} catch (err) {
  console.error(`\n[prisma-generate] Failed to generate Prisma Client using schema: ${schema}`);
  console.error("[prisma-generate] Ensure prisma is installed and DATABASE_URL is set correctly.");
  throw err;
}
