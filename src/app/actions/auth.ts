"use server";

import { createHash, randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";

import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  createSession,
  destroyAllSessionsForUser,
  destroySession,
  getCurrentUser,
} from "@/lib/auth/session";
import { requireUser } from "@/lib/auth/guards";
import { AppError, actionFail, actionOk, toActionError, type ActionResult } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/rate-limit";
import { formToObject, parseOrThrow } from "@/lib/validation/helpers";
import {
  affiliateRegisterSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "@/lib/validation/schemas";
import { recordAudit } from "@/lib/services/audit";
import { registerAffiliate } from "@/lib/services/affiliates";
import { LOCALE_COOKIE, normalizeLocale } from "@/lib/i18n/config";

const RESET_TTL_MINUTES = 60;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** Only allow same-origin relative redirects after login. */
function safeNext(next: unknown): string | null {
  if (typeof next !== "string") return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

export async function loginAction(
  formData: FormData,
): Promise<ActionResult<{ redirectTo: string }>> {
  try {
    await enforceRateLimit("login", { limit: 10, windowMs: 10 * 60 * 1000 });
    const input = parseOrThrow(loginSchema, formToObject(formData));

    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: { affiliate: { select: { status: true } } },
    });

    // Compare against a dummy hash when the user is missing so the response
    // time does not reveal whether an account exists.
    const hash =
      user?.passwordHash ??
      "$2a$12$0000000000000000000000000000000000000000000000000000";
    const valid = await verifyPassword(input.password, hash);

    if (!user || !valid) {
      await recordAudit({
        action: "LOGIN_FAILED",
        entityType: "User",
        entityId: user?.id ?? null,
        newValue: { email: input.email },
      });
      return actionFail("errors.invalidCredentials");
    }
    if (!user.isActive) return actionFail("errors.accountInactive");

    await createSession(user.id);
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    await recordAudit({
      action: "LOGIN_SUCCEEDED",
      entityType: "User",
      entityId: user.id,
      actor: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as "ADMIN" | "AFFILIATE",
        locale: user.locale,
        affiliateId: null,
        affiliateStatus: null,
        referralCode: null,
      },
    });

    // Keep the UI in the language stored on the account.
    const cookieStore = await cookies();
    cookieStore.set(LOCALE_COOKIE, normalizeLocale(user.locale), {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });

    const requested = safeNext(input.next);
    const fallback =
      user.role === "ADMIN"
        ? "/admin"
        : user.affiliate?.status === "ACTIVE"
          ? "/affiliate/dashboard"
          : "/affiliate/status";

    return actionOk({ redirectTo: requested ?? fallback });
  } catch (error) {
    return toActionError(error);
  }
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function registerAffiliateAction(
  formData: FormData,
): Promise<ActionResult<{ email: string }>> {
  try {
    await enforceRateLimit("register", { limit: 5, windowMs: 60 * 60 * 1000 });
    const input = parseOrThrow(affiliateRegisterSchema, formToObject(formData));
    const result = await registerAffiliate(input);

    // Sign the applicant straight in so they can follow their status.
    await createSession(result.userId);
    return actionOk({ email: input.email });
  } catch (error) {
    return toActionError(error);
  }
}

export async function forgotPasswordAction(
  formData: FormData,
): Promise<ActionResult<{ resetPath: string | null }>> {
  try {
    await enforceRateLimit("forgot-password", { limit: 5, windowMs: 30 * 60 * 1000 });
    const input = parseOrThrow(forgotPasswordSchema, formToObject(formData));

    const user = await prisma.user.findUnique({ where: { email: input.email } });
    // Always report success so the endpoint cannot be used to enumerate emails.
    if (!user || !user.isActive) return actionOk({ resetPath: null });

    const token = randomBytes(32).toString("base64url");
    await prisma.passwordResetToken.create({
      data: {
        tokenHash: hashToken(token),
        userId: user.id,
        expiresAt: new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000),
      },
    });
    await recordAudit({
      action: "PASSWORD_RESET_REQUESTED",
      entityType: "User",
      entityId: user.id,
      newValue: { email: user.email },
    });

    // No mail provider is configured, so the link is returned to the caller.
    // Swap this for an email send once SMTP/Resend credentials exist.
    return actionOk({ resetPath: `/reset-password?token=${token}` });
  } catch (error) {
    return toActionError(error);
  }
}

export async function resetPasswordAction(formData: FormData): Promise<ActionResult> {
  try {
    await enforceRateLimit("reset-password", { limit: 10, windowMs: 30 * 60 * 1000 });
    const input = parseOrThrow(resetPasswordSchema, formToObject(formData));

    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(input.token) },
      include: { user: true },
    });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return actionFail("errors.resetTokenInvalid");
    }

    const passwordHash = await hashPassword(input.password);
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      });
      await tx.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      });
      // Invalidate every other outstanding token and session.
      await tx.passwordResetToken.deleteMany({
        where: { userId: record.userId, usedAt: null },
      });
      await tx.session.deleteMany({ where: { userId: record.userId } });
      await recordAudit(
        {
          action: "PASSWORD_RESET_COMPLETED",
          entityType: "User",
          entityId: record.userId,
          newValue: { email: record.user.email },
        },
        tx,
      );
    });

    return actionOk();
  } catch (error) {
    return toActionError(error);
  }
}

export async function changePasswordAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await enforceRateLimit("change-password", {
      limit: 10,
      windowMs: 30 * 60 * 1000,
      identifier: user.id,
    });
    const input = parseOrThrow(changePasswordSchema, formToObject(formData));

    const record = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    const valid = await verifyPassword(input.currentPassword, record.passwordHash);
    if (!valid) {
      throw new AppError("errors.currentPasswordWrong", {
        fieldErrors: { currentPassword: "errors.currentPasswordWrong" },
      });
    }

    const passwordHash = await hashPassword(input.password);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    await destroyAllSessionsForUser(user.id);
    await createSession(user.id);
    await recordAudit({
      action: "PASSWORD_RESET_COMPLETED",
      entityType: "User",
      entityId: user.id,
      actor: user,
      newValue: { self: true },
    });

    return actionOk();
  } catch (error) {
    return toActionError(error);
  }
}

/** Used by the header language switcher to persist the preference. */
export async function setLocaleAction(locale: string): Promise<ActionResult> {
  try {
    const normalized = normalizeLocale(locale);
    const cookieStore = await cookies();
    cookieStore.set(LOCALE_COOKIE, normalized, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });

    const user = await getCurrentUser();
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { locale: normalized },
      });
    }
    return actionOk();
  } catch (error) {
    return toActionError(error);
  }
}

/** Exposed so pages can log the request origin for audit entries. */
export async function currentOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  const headerStore = await headers();
  const host = headerStore.get("host") ?? "localhost:43711";
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
