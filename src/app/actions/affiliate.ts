"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { requireActiveAffiliate, requireAffiliate } from "@/lib/auth/guards";
import { actionOk, toActionError, type ActionResult } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/rate-limit";
import { formToObject, parseOrThrow } from "@/lib/validation/helpers";
import {
  affiliateProfileSchema,
  payoutDetailsSchema,
  requestPayoutSchema,
} from "@/lib/validation/schemas";
import { recordAudit } from "@/lib/services/audit";
import { syncSocials } from "@/lib/services/affiliates";
import { requestPayout } from "@/lib/services/payouts";
import { LOCALE_COOKIE } from "@/lib/i18n/config";
import { cookies } from "next/headers";

export async function updateAffiliateProfileAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await requireAffiliate();
    const input = parseOrThrow(affiliateProfileSchema, formToObject(formData));

    const existing = await prisma.affiliate.findUniqueOrThrow({
      where: { id: user.affiliateId },
      select: { fullName: true, phone: true, bio: true },
    });

    await prisma.$transaction(async (tx) => {
      await tx.affiliate.update({
        where: { id: user.affiliateId },
        data: {
          fullName: input.fullName,
          phone: input.phone,
          bio: input.bio ?? null,
        },
      });
      await tx.user.update({
        where: { id: user.id },
        data: { name: input.fullName, locale: input.locale },
      });
      await syncSocials(tx, user.affiliateId, input);
      await recordAudit(
        {
          action: "AFFILIATE_UPDATED",
          entityType: "Affiliate",
          entityId: user.affiliateId,
          actor: user,
          previousValue: existing,
          newValue: {
            fullName: input.fullName,
            phone: input.phone,
            bio: input.bio ?? null,
            locale: input.locale,
          },
        },
        tx,
      );
    });

    const cookieStore = await cookies();
    cookieStore.set(LOCALE_COOKIE, input.locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });

    revalidatePath("/affiliate/profile");
    return actionOk();
  } catch (error) {
    return toActionError(error);
  }
}

export async function updatePayoutDetailsAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await requireAffiliate();
    const input = parseOrThrow(payoutDetailsSchema, formToObject(formData));

    await prisma.$transaction(async (tx) => {
      await tx.affiliate.update({
        where: { id: user.affiliateId },
        data: {
          payoutMethod: input.payoutMethod,
          payoutAccountName: input.payoutAccountName ?? null,
          payoutIban: input.payoutIban ?? null,
          payoutBankName: input.payoutBankName ?? null,
          payoutPaypalEmail: input.payoutPaypalEmail ?? null,
          payoutOtherDetails: input.payoutOtherDetails ?? null,
        },
      });
      // The values themselves are sensitive, so only the method is logged.
      await recordAudit(
        {
          action: "PAYOUT_DETAILS_UPDATED",
          entityType: "Affiliate",
          entityId: user.affiliateId,
          actor: user,
          newValue: { payoutMethod: input.payoutMethod },
        },
        tx,
      );
    });

    revalidatePath("/affiliate/profile");
    revalidatePath("/affiliate/payouts");
    return actionOk();
  } catch (error) {
    return toActionError(error);
  }
}

export async function requestPayoutAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireActiveAffiliate();
    await enforceRateLimit("request-payout", {
      limit: 5,
      windowMs: 60 * 60 * 1000,
      identifier: user.id,
    });
    parseOrThrow(requestPayoutSchema, formToObject(formData));

    // The amount is derived from approved commissions inside the service.
    await requestPayout(user, user.affiliateId);

    revalidatePath("/affiliate/payouts");
    revalidatePath("/affiliate/dashboard");
    return actionOk();
  } catch (error) {
    return toActionError(error);
  }
}
