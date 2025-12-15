// Fail fast on Vercel when DATABASE_URL is missing.
// Prisma generate validates DATABASE_URL shape and will fail anyway; this makes the error obvious.
if (process.env.VERCEL && !process.env.DATABASE_URL) {
  console.error("\n[preflight] Missing DATABASE_URL in Vercel environment variables.");
  console.error("[preflight] Set it in Project Settings > Environment Variables (Production + Preview).\n");
  process.exit(1);
}
