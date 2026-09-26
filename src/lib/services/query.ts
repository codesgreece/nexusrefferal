import type { Prisma } from "@prisma/client";

/**
 * Case-insensitive substring filter. PostgreSQL `LIKE` is case sensitive, so
 * every free-text search in the app goes through this helper.
 */
export function like(value: string): Prisma.StringFilter {
  return { contains: value, mode: "insensitive" };
}

/** Same, for nullable columns. */
export function likeNullable(value: string): Prisma.StringNullableFilter {
  return { contains: value, mode: "insensitive" };
}
