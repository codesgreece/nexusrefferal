"use server";

import { prisma } from "@/lib/db";
import { actionOk, toActionError, type ActionResult } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/rate-limit";
import { formToObject, parseOrThrow } from "@/lib/validation/helpers";
import { publicLeadSchema } from "@/lib/validation/schemas";
import { createPublicLead } from "@/lib/services/leads";
import { readReferralCookie, resolveCode } from "@/lib/services/referral";
import { getSettings } from "@/lib/services/settings";
import { AppError } from "@/lib/errors";

export async function submitPublicLeadAction(
  formData: FormData,
): Promise<ActionResult<{ reference: string; attributed: boolean; affiliateName: string | null }>> {
  try {
    await enforceRateLimit("public-lead", { limit: 8, windowMs: 60 * 60 * 1000 });

    const settings = await getSettings();
    if (!settings.programActive) {
      // The studio still wants the enquiry; it just cannot be attributed.
      // Kept explicit so the behaviour is obvious rather than accidental.
    }

    const input = parseOrThrow(publicLeadSchema, formToObject(formData));
    const cookieCode = await readReferralCookie();

    const result = await createPublicLead({
      customerName: input.customerName,
      businessName: input.businessName,
      email: input.email,
      phone: input.phone,
      serviceId: input.serviceId,
      message: input.message,
      referralCode: input.referralCode,
      cookieCode,
    });

    return actionOk({
      reference: result.reference,
      attributed: result.attributed,
      affiliateName: result.affiliateName,
    });
  } catch (error) {
    return toActionError(error);
  }
}

/** Live validation for the referral code field on the public form. */
export async function validateReferralCodeAction(
  rawCode: string,
): Promise<ActionResult<{ code: string; affiliateName: string }>> {
  try {
    await enforceRateLimit("validate-code", { limit: 40, windowMs: 10 * 60 * 1000 });
    const resolved = await resolveCode(rawCode);
    if (!resolved) throw new AppError("errors.referralCodeInvalid");
    // Only the display name is exposed — never contact or payout details.
    return actionOk({ code: resolved.code, affiliateName: resolved.affiliateName });
  } catch (error) {
    return toActionError(error);
  }
}

export async function activeServiceOptionsAction() {
  return prisma.service.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }],
    select: { id: true, slug: true, nameEn: true, nameEl: true },
  });
}
