import "server-only";

/**
 * Simple in-memory rate limiter (token bucket per key).
 *
 * Notes:
 * - Works best for low/medium traffic and internal tools.
 * - On Vercel Serverless/Edge, state is per-instance (not global). Still useful.
 * - If you need strict global limits, replace with a durable store (Upstash/Redis).
 */

type Bucket = { tokens: number; lastRefillMs: number };

type RateLimitOptions = {
  key: string;
  capacity: number; // max burst
  refillPerSecond: number; // tokens/sec
};

const GLOBAL = globalThis as unknown as { __rateBuckets?: Map<string, Bucket> };

function buckets(): Map<string, Bucket> {
  if (!GLOBAL.__rateBuckets) GLOBAL.__rateBuckets = new Map();
  return GLOBAL.__rateBuckets;
}

export function rateLimit(opts: RateLimitOptions): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const now = Date.now();
  const map = buckets();
  const b = map.get(opts.key) ?? { tokens: opts.capacity, lastRefillMs: now };

  const elapsedSec = Math.max(0, (now - b.lastRefillMs) / 1000);
  const refill = elapsedSec * opts.refillPerSecond;
  b.tokens = Math.min(opts.capacity, b.tokens + refill);
  b.lastRefillMs = now;

  if (b.tokens < 1) {
    map.set(opts.key, b);
    const missing = 1 - b.tokens;
    const retryAfterSeconds = Math.ceil(missing / opts.refillPerSecond);
    return { ok: false, retryAfterSeconds: Math.max(1, retryAfterSeconds) };
  }

  b.tokens -= 1;
  map.set(opts.key, b);
  return { ok: true };
}
