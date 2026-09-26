import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";

import { prisma } from "@/lib/db";
import type { Role } from "@/lib/domain";

export const SESSION_COOKIE = "nds_session";
const SESSION_TTL_DAYS = 14;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  locale: string;
  affiliateId: string | null;
  affiliateStatus: string | null;
  referralCode: string | null;
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function requestContext() {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  return {
    ip: forwarded?.split(",")[0]?.trim() ?? headerStore.get("x-real-ip") ?? null,
    userAgent: headerStore.get("user-agent") ?? null,
  };
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const { ip, userAgent } = await requestContext();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: { tokenHash: hashToken(token), userId, expiresAt, ip, userAgent },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  // Opportunistic cleanup keeps the session table from growing unbounded.
  await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function destroyAllSessionsForUser(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });
}

/**
 * Resolves the current user from the session cookie. Always hits the database
 * so that role, status and referral code changes take effect immediately.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        include: {
          affiliate: {
            include: {
              referralCodes: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) return null;
  if (!session.user.isActive) return null;

  const { user } = session;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
    locale: user.locale,
    affiliateId: user.affiliate?.id ?? null,
    affiliateStatus: user.affiliate?.status ?? null,
    referralCode: user.affiliate?.referralCodes[0]?.code ?? null,
  };
}
