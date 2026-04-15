// Simple in-memory rate limiter (per-process, resets on server restart).
// Sufficient for MVP — no Redis dependency required.

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const attempts = new Map<string, RateLimitRecord>();

/**
 * Check if the given key has exceeded the allowed attempts within the window.
 *
 * @param key         Unique identifier (e.g. IP address + route)
 * @param maxAttempts Maximum allowed attempts in the window
 * @param windowMs    Time window in milliseconds
 */
export function rateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || now > record.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  if (record.count >= maxAttempts) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: maxAttempts - record.count };
}

/**
 * Periodically prune expired entries to prevent unbounded memory growth.
 * Called lazily — no background timer needed.
 */
let lastPruneAt = 0;
export function pruneExpired(): void {
  const now = Date.now();
  // Only prune at most once every 5 minutes
  if (now - lastPruneAt < 5 * 60 * 1000) return;
  lastPruneAt = now;
  for (const [key, record] of attempts.entries()) {
    if (now > record.resetAt) {
      attempts.delete(key);
    }
  }
}
