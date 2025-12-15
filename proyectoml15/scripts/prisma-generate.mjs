import { execSync } from "node:child_process";

/**
 * Generate Prisma Client before Next.js build/typecheck.
 *
 * Why this exists:
 * - We avoid running Prisma in postinstall because some platforms (e.g. Vercel)
 *   may not expose DATABASE_URL during the install step.
 * - Prisma requires DATABASE_URL to be defined to parse the datasource, even for `generate`.
 *
 * This project supports:
 * - Dev: SQLite schema at prisma/schema.prisma
 * - Prod: Postgres schema at prisma_pg/schema.prisma
 */

const originalUrl = process.env.DATABASE_URL ?? "";

// If DATABASE_URL is missing, provide a safe SQLite default so `prisma generate` can run.
if (!originalUrl) {
  process.env.DATABASE_URL = "file:./dev.db";
}

const url = process.env.DATABASE_URL ?? "";
const isPostgres = url.startsWith("postgres://") || url.startsWith("postgresql://");
const schema = isPostgres ? "prisma_pg/schema.prisma" : "prisma/schema.prisma";

try {
  // Use local prisma from node_modules; do not download anything at build time.
  execSync(`npx --no-install prisma generate --schema "${schema}"`, { stdio: "inherit" });
} catch (err) {
  console.error(`\n[prisma-generate] Failed to generate Prisma Client using schema: ${schema}`);
  console.error("[prisma-generate] Ensure prisma is installed and DATABASE_URL is set correctly.");
  throw err;
}
