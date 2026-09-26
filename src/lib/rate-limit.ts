import "server-only";

import { createHash } from "node:crypto";

import { AppError } from "@/lib/errors";
import { requestContext } from "@/lib/auth/session";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 20_000;

/**
 * Fixed-window in-memory limiter. Adequate for a single-instance deployment;
 * behind multiple instances this should be swapped for a shared store.
 */
export function consume(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    if (buckets.size > MAX_KEYS) buckets.clear();
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (existing.count >= limit) return false;
  existing.count += 1;
  return true;
}

export async function enforceRateLimit(
  scope: string,
  options: { limit: number; windowMs: number; identifier?: string },
) {
  const { ip } = await requestContext();
  const identifier = options.identifier ?? ip ?? "anonymous";
  const key = `${scope}:${createHash("sha256").update(identifier).digest("hex")}`;
  if (!consume(key, options.limit, options.windowMs)) {
    throw new AppError("errors.rateLimited");
  }
}

export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  const salt = process.env.SESSION_SECRET ?? "nds-affiliates";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}
