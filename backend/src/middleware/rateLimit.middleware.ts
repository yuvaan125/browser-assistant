import { Request, Response, NextFunction } from "express";

/**
 * Coarse per-IP request cap.
 *
 * This sits in front of requireAuth on purpose: verifying a token costs a
 * network round-trip to Supabase, so without this an unauthenticated caller
 * can force one outbound request per inbound request. The per-user daily quota
 * in usage.service.ts is the real product limit — this only exists to stop
 * cheap abuse of a publicly reachable endpoint.
 *
 * State is in-memory, so it resets on deploy and is per-instance. That's fine
 * for a single small instance; a shared store would be needed if this ever
 * scales horizontally.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 60;

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Buckets are only touched on request, so expired entries for IPs that never
// come back would otherwise leak. Sweep them periodically.
const sweep = setInterval(() => {
  const now = Date.now();

  for (const [ip, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(ip);
    }
  }
}, WINDOW_MS);

// Don't hold the process open just for the sweep timer.
sweep.unref?.();

export function rateLimit(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const ip = req.ip ?? "unknown";
  const now = Date.now();

  const bucket = buckets.get(ip);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  bucket.count += 1;

  if (bucket.count > MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);

    res.setHeader("Retry-After", String(retryAfter));

    return res.status(429).json({
      success: false,
      error: "Too many requests. Please slow down.",
    });
  }

  next();
}
