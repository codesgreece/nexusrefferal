"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/guards";
import { actionOk, toActionError, type ActionResult } from "@/lib/errors";
import { formToObject, parseOrThrow } from "@/lib/validation/helpers";
import {
  approveAffiliateSchema,
  changeReferralCodeSchema,
  reactivateAffiliateSchema,
  rejectAffiliateSchema,
  suspendAffiliateSchema,
  toggleReferralCodeSchema,
  updateAffiliateSchema,
} from "@/lib/validation/schemas";
import {
  approveAffiliate,
  changeReferralCode,
  reactivateAffiliate,
  rejectAffiliate,
  setReferralCodeActive,
  suspendAffiliate,
  updateAffiliateDetails,
} from "@/lib/services/affiliates";
import { suggestCode } from "@/lib/services/referral";

function revalidateAffiliateViews(affiliateId?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/affiliates");
  revalidatePath("/admin/applications");
  if (affiliateId) revalidatePath(`/admin/affiliates/${affiliateId}`);
}

export async function suggestReferralCodeAction(
  fullName: string,
): Promise<ActionResult<{ code: string }>> {
  try {
    await requireAdmin();
    return actionOk({ code: await suggestCode(fullName) });
  } catch (error) {
    return toActionError(error);
  }
}

export async function approveAffiliateAction(
  formData: FormData,
): Promise<ActionResult<{ code: string }>> {
  try {
    const admin = await requireAdmin();
    const input = parseOrThrow(approveAffiliateSchema, formToObject(formData));
    const result = await approveAffiliate(admin, input);
    revalidateAffiliateViews(input.affiliateId);
    return actionOk(result);
  } catch (error) {
    return toActionError(error);
  }
}

export async function rejectAffiliateAction(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const input = parseOrThrow(rejectAffiliateSchema, formToObject(formData));
    await rejectAffiliate(admin, input);
    revalidateAffiliateViews(input.affiliateId);
    return actionOk();
  } catch (error) {
    return toActionError(error);
  }
}

export async function suspendAffiliateAction(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const input = parseOrThrow(suspendAffiliateSchema, formToObject(formData));
    await suspendAffiliate(admin, input);
    revalidateAffiliateViews(input.affiliateId);
    return actionOk();
  } catch (error) {
    return toActionError(error);
  }
}

export async function reactivateAffiliateAction(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const input = parseOrThrow(reactivateAffiliateSchema, formToObject(formData));
    await reactivateAffiliate(admin, input.affiliateId);
    revalidateAffiliateViews(input.affiliateId);
    return actionOk();
  } catch (error) {
    return toActionError(error);
  }
}

export async function changeReferralCodeAction(
  formData: FormData,
): Promise<ActionResult<{ code: string }>> {
  try {
    const admin = await requireAdmin();
    const input = parseOrThrow(changeReferralCodeSchema, formToObject(formData));
    const result = await changeReferralCode(admin, input);
    revalidateAffiliateViews(input.affiliateId);
    return actionOk(result);
  } catch (error) {
    return toActionError(error);
  }
}

export async function toggleReferralCodeAction(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const input = parseOrThrow(toggleReferralCodeSchema, formToObject(formData));
    await setReferralCodeActive(admin, input);
    revalidateAffiliateViews();
    return actionOk();
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateAffiliateAction(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const input = parseOrThrow(updateAffiliateSchema, formToObject(formData));
    await updateAffiliateDetails(admin, input);
    revalidateAffiliateViews(input.affiliateId);
    return actionOk();
  } catch (error) {
    return toActionError(error);
  }
}
