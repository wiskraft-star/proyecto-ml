import { execSync } from "node:child_process";

/**
 * Prisma Client is generated during install/build.
 * This project supports:
 * - Dev: SQLite schema at prisma/schema.prisma
 * - Prod: Postgres schema at prisma_pg/schema.prisma
 *
 * We choose schema based on DATABASE_URL protocol.
 */
const url = process.env.DATABASE_URL ?? "";
const isPostgres = url.startsWith("postgres://") || url.startsWith("postgresql://");
const schema = isPostgres ? "prisma_pg/schema.prisma" : "prisma/schema.prisma";

try {
  execSync(`npx prisma generate --schema ${schema}`, { stdio: "inherit" });
} catch (err) {
  // Provide a clear error message but rethrow to fail the build.
  console.error(`\n[prisma-generate] Failed to generate Prisma Client using schema: ${schema}`);
  console.error("[prisma-generate] Check DATABASE_URL and that Prisma is installed.");
  throw err;
}
