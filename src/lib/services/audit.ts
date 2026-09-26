import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import type { AuditAction } from "@/lib/domain";
import { requestContext } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/session";

type Client = Prisma.TransactionClient | typeof prisma;

export type AuditInput = {
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  actor?: SessionUser | null;
  previousValue?: unknown;
  newValue?: unknown;
  metadata?: unknown;
  /** Set explicitly when the caller already resolved the request context. */
  ip?: string | null;
  userAgent?: string | null;
};

function serialize(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Appends an audit entry. Audit writes never block the operation they describe:
 * a logging failure is reported to the server console but does not roll back a
 * committed business action unless it runs inside the caller's transaction.
 */
export async function recordAudit(input: AuditInput, client: Client = prisma) {
  let ip = input.ip ?? null;
  let userAgent = input.userAgent ?? null;
  if (ip === null && userAgent === null) {
    try {
      const ctx = await requestContext();
      ip = ctx.ip;
      userAgent = ctx.userAgent;
    } catch {
      // Outside a request scope (seed scripts) there is no header store.
    }
  }

  return client.auditLog.create({
    data: {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      actorUserId: input.actor?.id ?? null,
      actorEmail: input.actor?.email ?? null,
      actorRole: input.actor?.role ?? null,
      previousValue: serialize(input.previousValue),
      newValue: serialize(input.newValue),
      metadata: serialize(input.metadata),
      ip,
      userAgent,
    },
  });
}

export function diffFields<T extends Record<string, unknown>>(
  before: T,
  after: Partial<T>,
): { previous: Record<string, unknown>; next: Record<string, unknown> } | null {
  const previous: Record<string, unknown> = {};
  const next: Record<string, unknown> = {};
  let changed = false;

  for (const [key, value] of Object.entries(after)) {
    const old = before[key];
    const oldComparable = old instanceof Date ? old.toISOString() : old;
    const newComparable = value instanceof Date ? value.toISOString() : value;
    if (oldComparable !== newComparable) {
      previous[key] = oldComparable ?? null;
      next[key] = newComparable ?? null;
      changed = true;
    }
  }

  return changed ? { previous, next } : null;
}
