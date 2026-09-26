import "server-only";

import { redirect } from "next/navigation";

import { AppError } from "@/lib/errors";
import { getCurrentUser, type SessionUser } from "./session";

/** For pages: bounces unauthenticated visitors to the login screen. */
export async function requireUserPage(returnTo?: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(returnTo ? `/login?next=${encodeURIComponent(returnTo)}` : "/login");
  }
  return user;
}

export async function requireAdminPage(): Promise<SessionUser> {
  const user = await requireUserPage("/admin");
  if (user.role !== "ADMIN") redirect("/affiliate/dashboard");
  return user;
}

export async function requireAffiliatePage(): Promise<SessionUser> {
  const user = await requireUserPage("/affiliate/dashboard");
  if (user.role !== "AFFILIATE") redirect("/admin");
  return user;
}

/**
 * For pages that require an approved affiliate. Non-approved affiliates are
 * sent to the status screen instead of being shown an empty dashboard.
 */
export async function requireActiveAffiliatePage(): Promise<
  SessionUser & { affiliateId: string }
> {
  const user = await requireAffiliatePage();
  if (!user.affiliateId) redirect("/login");
  if (user.affiliateStatus !== "ACTIVE") redirect("/affiliate/status");
  return user as SessionUser & { affiliateId: string };
}

/** For server actions and route handlers: throws instead of redirecting. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AppError("errors.unauthorized");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new AppError("errors.forbidden");
  return user;
}

export async function requireAffiliate(): Promise<
  SessionUser & { affiliateId: string }
> {
  const user = await requireUser();
  if (user.role !== "AFFILIATE" || !user.affiliateId) {
    throw new AppError("errors.forbidden");
  }
  return user as SessionUser & { affiliateId: string };
}

export async function requireActiveAffiliate(): Promise<
  SessionUser & { affiliateId: string }
> {
  const user = await requireAffiliate();
  if (user.affiliateStatus !== "ACTIVE") {
    throw new AppError("errors.affiliateNotApproved");
  }
  return user;
}

/**
 * Affiliates may only ever read their own records. Every affiliate-scoped
 * query goes through this so ownership is enforced on the server.
 */
export function assertOwnership(user: SessionUser, affiliateId: string | null) {
  if (user.role === "ADMIN") return;
  if (!affiliateId || user.affiliateId !== affiliateId) {
    throw new AppError("errors.forbidden");
  }
}
