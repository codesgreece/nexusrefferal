import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

type Client = Prisma.TransactionClient | typeof prisma;

/**
 * Human-readable, monotonically increasing references (LD-000123). The counter
 * row is updated atomically so concurrent writers cannot collide.
 */
export async function nextReference(
  prefix: "LD" | "SL" | "PO",
  client: Client = prisma,
): Promise<string> {
  const counter = await client.counter.upsert({
    where: { name: prefix },
    update: { value: { increment: 1 } },
    create: { name: prefix, value: 1 },
  });
  return `${prefix}-${String(counter.value).padStart(6, "0")}`;
}
