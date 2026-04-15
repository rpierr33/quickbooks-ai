// Rate limiter with Upstash Redis support and in-memory fallback.
// When UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set, rate limit
// state is shared across all serverless instances (required for production).
// Without those env vars, falls back to a per-process in-memory Map.

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// ---------------------------------------------------------------------------
// Redis path (Upstash REST API — pipeline: INCR + PEXPIRE)
// ---------------------------------------------------------------------------

async function redisIncr(key: string, windowMs: number): Promise<{ count: number }> {
  const res = await fetch(`${REDIS_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['INCR', key],
      ['PEXPIRE', key, windowMs],
    ]),
  });

  if (!res.ok) {
    throw new Error(`Upstash pipeline failed: ${res.status}`);
  }

  const data = (await res.json()) as Array<{ result?: number }>;
  return { count: data[0]?.result ?? 1 };
}

// ---------------------------------------------------------------------------
// In-memory fallback
// ---------------------------------------------------------------------------

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const attempts = new Map<string, RateLimitRecord>();

function inMemoryIncr(
  key: string,
  windowMs: number
): { count: number } {
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || now > record.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return { count: 1 };
  }

  record.count++;
  return { count: record.count };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check whether `key` has exceeded `maxAttempts` within `windowMs`.
 * Returns `{ allowed, remaining }`.
 *
 * The function is async because the Redis path requires a network call.
 * The in-memory path resolves synchronously (via Promise.resolve).
 *
 * @param key         Unique identifier (e.g. `signup:<ip>`)
 * @param maxAttempts Maximum allowed attempts in the window
 * @param windowMs    Time window in milliseconds
 */
export async function rateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number }> {
  let count: number;

  if (REDIS_URL && REDIS_TOKEN) {
    try {
      ({ count } = await redisIncr(`rl:${key}`, windowMs));
    } catch {
      // Redis unavailable — degrade gracefully to in-memory
      ({ count } = inMemoryIncr(key, windowMs));
    }
  } else {
    ({ count } = inMemoryIncr(key, windowMs));
  }

  return {
    allowed: count <= maxAttempts,
    remaining: Math.max(0, maxAttempts - count),
  };
}

/**
 * Periodically prune expired in-memory entries to prevent unbounded growth.
 * No-op when using Redis (Redis TTLs handle expiry automatically).
 */
let lastPruneAt = 0;
export function pruneExpired(): void {
  if (REDIS_URL && REDIS_TOKEN) return; // Redis handles its own TTLs
  const now = Date.now();
  if (now - lastPruneAt < 5 * 60 * 1000) return;
  lastPruneAt = now;
  for (const [key, record] of attempts.entries()) {
    if (now > record.resetAt) {
      attempts.delete(key);
    }
  }
}
