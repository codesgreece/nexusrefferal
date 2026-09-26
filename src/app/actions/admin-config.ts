"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";
import { AppError, actionOk, toActionError, type ActionResult } from "@/lib/errors";
import { formToObject, parseOrThrow } from "@/lib/validation/helpers";
import {
  createResourceSchema,
  createServiceSchema,
  deleteResourceSchema,
  settingsSchema,
  updateResourceSchema,
  updateServiceSchema,
} from "@/lib/validation/schemas";
import { diffFields, recordAudit } from "@/lib/services/audit";
import { SETTINGS_ID, getSettings } from "@/lib/services/settings";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function linesToJson(value: string | undefined) {
  if (!value) return "[]";
  const items = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return JSON.stringify(items);
}

function revalidateConfig() {
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Services & pricing
// ---------------------------------------------------------------------------

export async function createServiceAction(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const input = parseOrThrow(createServiceSchema, formToObject(formData));

    let slug = slugify(input.nameEn);
    for (let attempt = 2; attempt < 50; attempt += 1) {
      const taken = await prisma.service.findUnique({ where: { slug } });
      if (!taken) break;
      slug = `${slugify(input.nameEn)}-${attempt}`;
    }

    const service = await prisma.service.create({
      data: {
        slug,
        name: input.nameEn,
        nameEn: input.nameEn,
        nameEl: input.nameEl,
        descriptionEn: input.descriptionEn,
        descriptionEl: input.descriptionEl,
        featuresEn: linesToJson(input.featuresEn),
        featuresEl: linesToJson(input.featuresEl),
        startingPriceCents: input.startingPrice,
        priceFrom: input.priceFrom,
        commissionType: input.commissionType,
        commissionFixedCents:
          input.commissionType === "FIXED" ? (input.commissionFixed ?? 0) : null,
        commissionPercent:
          input.commissionType === "PERCENT" ? (input.commissionPercent ?? 0) : null,
        isActive: input.isActive,
        sortOrder: input.sortOrder,
      },
    });

    await recordAudit({
      action: "SERVICE_CREATED",
      entityType: "Service",
      entityId: service.id,
      actor: admin,
      newValue: {
        slug,
        nameEn: input.nameEn,
        startingPriceCents: input.startingPrice,
        commissionType: input.commissionType,
      },
    });

    revalidateConfig();
    return actionOk();
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateServiceAction(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const input = parseOrThrow(updateServiceSchema, formToObject(formData));

    const existing = await prisma.service.findUnique({ where: { id: input.serviceId } });
    if (!existing) throw new AppError("errors.notFound");

    const next = {
      name: input.nameEn,
      nameEn: input.nameEn,
      nameEl: input.nameEl,
      descriptionEn: input.descriptionEn,
      descriptionEl: input.descriptionEl,
      featuresEn: linesToJson(input.featuresEn),
      featuresEl: linesToJson(input.featuresEl),
      startingPriceCents: input.startingPrice,
      priceFrom: input.priceFrom,
      commissionType: input.commissionType,
      commissionFixedCents:
        input.commissionType === "FIXED" ? (input.commissionFixed ?? 0) : null,
      commissionPercent:
        input.commissionType === "PERCENT" ? (input.commissionPercent ?? 0) : null,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
    };

    await prisma.service.update({ where: { id: existing.id }, data: next });

    // Existing commissions keep the rate they were created with; changing a
    // service only affects sales confirmed from now on.
    const diff = diffFields(existing as unknown as Record<string, unknown>, next);
    await recordAudit({
      action: "SERVICE_UPDATED",
      entityType: "Service",
      entityId: existing.id,
      actor: admin,
      previousValue: diff?.previous,
      newValue: diff?.next,
    });

    revalidateConfig();
    return actionOk();
  } catch (error) {
    return toActionError(error);
  }
}

// ---------------------------------------------------------------------------
// Affiliate resources
// ---------------------------------------------------------------------------

export async function createResourceAction(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const input = parseOrThrow(createResourceSchema, formToObject(formData));

    const resource = await prisma.affiliateResource.create({
      data: {
        titleEn: input.titleEn,
        titleEl: input.titleEl,
        descriptionEn: input.descriptionEn,
        descriptionEl: input.descriptionEl,
        type: input.type,
        contentEn: input.contentEn ?? null,
        contentEl: input.contentEl ?? null,
        url: input.url ?? null,
        thumbnailUrl: input.thumbnailUrl ?? null,
        isActive: input.isActive,
        sortOrder: input.sortOrder,
      },
    });

    await recordAudit({
      action: "RESOURCE_CREATED",
      entityType: "AffiliateResource",
      entityId: resource.id,
      actor: admin,
      newValue: { titleEn: input.titleEn, type: input.type },
    });

    revalidatePath("/admin/resources");
    revalidatePath("/affiliate/resources");
    return actionOk();
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateResourceAction(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const input = parseOrThrow(updateResourceSchema, formToObject(formData));

    const existing = await prisma.affiliateResource.findUnique({
      where: { id: input.resourceId },
    });
    if (!existing) throw new AppError("errors.notFound");

    await prisma.affiliateResource.update({
      where: { id: existing.id },
      data: {
        titleEn: input.titleEn,
        titleEl: input.titleEl,
        descriptionEn: input.descriptionEn,
        descriptionEl: input.descriptionEl,
        type: input.type,
        contentEn: input.contentEn ?? null,
        contentEl: input.contentEl ?? null,
        url: input.url ?? null,
        thumbnailUrl: input.thumbnailUrl ?? null,
        isActive: input.isActive,
        sortOrder: input.sortOrder,
      },
    });

    await recordAudit({
      action: "RESOURCE_UPDATED",
      entityType: "AffiliateResource",
      entityId: existing.id,
      actor: admin,
      previousValue: { titleEn: existing.titleEn, isActive: existing.isActive },
      newValue: { titleEn: input.titleEn, isActive: input.isActive },
    });

    revalidatePath("/admin/resources");
    revalidatePath("/affiliate/resources");
    return actionOk();
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteResourceAction(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const input = parseOrThrow(deleteResourceSchema, formToObject(formData));

    const existing = await prisma.affiliateResource.findUnique({
      where: { id: input.resourceId },
    });
    if (!existing) throw new AppError("errors.notFound");

    await prisma.affiliateResource.delete({ where: { id: existing.id } });
    await recordAudit({
      action: "RESOURCE_DELETED",
      entityType: "AffiliateResource",
      entityId: existing.id,
      actor: admin,
      previousValue: { titleEn: existing.titleEn, type: existing.type },
    });

    revalidatePath("/admin/resources");
    revalidatePath("/affiliate/resources");
    return actionOk();
  } catch (error) {
    return toActionError(error);
  }
}

// ---------------------------------------------------------------------------
// Program settings
// ---------------------------------------------------------------------------

export async function updateSettingsAction(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const input = parseOrThrow(settingsSchema, formToObject(formData));
    const existing = await getSettings();

    const next = {
      programName: input.programName,
      programActive: input.programActive,
      minPayoutCents: input.minPayout,
      referralCookieDays: input.referralCookieDays,
      domainFeeCents: input.domainFee,
      defaultCommissionType: input.defaultCommissionType,
      defaultCommissionFixedCents: input.defaultCommissionFixed,
      defaultCommissionPercent: input.defaultCommissionPercent,
      contactEmail: input.contactEmail,
      termsUrl: input.termsUrl,
      privacyUrl: input.privacyUrl,
      paymentInstructionsEn: input.paymentInstructionsEn ?? "",
      paymentInstructionsEl: input.paymentInstructionsEl ?? "",
      termsContentEn: input.termsContentEn ?? "",
      termsContentEl: input.termsContentEl ?? "",
      privacyContentEn: input.privacyContentEn ?? "",
      privacyContentEl: input.privacyContentEl ?? "",
    };

    await prisma.programSettings.update({ where: { id: SETTINGS_ID }, data: next });

    // Long legal bodies are excluded from the audit diff to keep it readable;
    // the fact that they changed is still recorded.
    const { termsContentEn, termsContentEl, privacyContentEn, privacyContentEl, ...concise } =
      next;
    const diff = diffFields(existing as unknown as Record<string, unknown>, concise);
    await recordAudit({
      action: "SETTINGS_CHANGED",
      entityType: "ProgramSettings",
      entityId: SETTINGS_ID,
      actor: admin,
      previousValue: diff?.previous,
      newValue: diff?.next,
      metadata: {
        legalContentChanged:
          termsContentEn !== existing.termsContentEn ||
          termsContentEl !== existing.termsContentEl ||
          privacyContentEn !== existing.privacyContentEn ||
          privacyContentEl !== existing.privacyContentEl,
      },
    });

    revalidateConfig();
    return actionOk();
  } catch (error) {
    return toActionError(error);
  }
}
