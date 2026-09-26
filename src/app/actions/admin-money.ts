"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";
import { AppError, actionOk, toActionError, type ActionResult } from "@/lib/errors";
import { formToObject, parseOrThrow } from "@/lib/validation/helpers";
import {
  commissionActionSchema,
  commissionMarkPaidSchema,
  commissionReasonSchema,
  payoutActionSchema,
  payoutPaidSchema,
  payoutRejectSchema,
} from "@/lib/validation/schemas";
import { recordAudit } from "@/lib/services/audit";
import { notify } from "@/lib/services/notifications";
import { approvePayout, markPayoutPaid, rejectPayout } from "@/lib/services/payouts";

function revalidateMoney() {
  revalidatePath("/admin");
  revalidatePath("/admin/commissions");
  revalidatePath("/admin/payouts");
  revalidatePath("/affiliate/commissions");
  revalidatePath("/affiliate/payouts");
}

/**
 * Commission transitions. Only an administrator can reach these, and the
 * allowed source states are checked server-side on every call so the UI can
 * never drive an illegal transition.
 */
export async function approveCommissionAction(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const input = parseOrThrow(commissionActionSchema, formToObject(formData));

    const commission = await prisma.commission.findUnique({
      where: { id: input.commissionId },
      include: { affiliate: { select: { userId: true } } },
    });
    if (!commission) throw new AppError("errors.notFound");
    if (commission.status !== "PENDING") throw new AppError("errors.invalidCommissionState");

    await prisma.$transaction(async (tx) => {
      await tx.commission.update({
        where: { id: commission.id },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
          approvedById: admin.id,
          rejectedAt: null,
          rejectionReason: null,
          internalNotes: input.internalNotes ?? commission.internalNotes,
        },
      });
      await recordAudit(
        {
          action: "COMMISSION_APPROVED",
          entityType: "Commission",
          entityId: commission.id,
          actor: admin,
          previousValue: { status: commission.status },
          newValue: { status: "APPROVED" },
        },
        tx,
      );
      await notify(
        {
          userId: commission.affiliate.userId,
          type: "COMMISSION_APPROVED",
          params: { amount: (commission.commissionAmountCents / 100).toFixed(2) },
          link: "/affiliate/commissions",
          severity: "SUCCESS",
        },
        tx,
      );
    });

    revalidateMoney();
    return actionOk();
  } catch (error) {
    return toActionError(error);
  }
}

export async function rejectCommissionAction(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const input = parseOrThrow(commissionReasonSchema, formToObject(formData));

    const commission = await prisma.commission.findUnique({
      where: { id: input.commissionId },
      include: { affiliate: { select: { userId: true } } },
    });
    if (!commission) throw new AppError("errors.notFound");
    if (commission.status !== "PENDING") throw new AppError("errors.invalidCommissionState");

    await prisma.$transaction(async (tx) => {
      await tx.commission.update({
        where: { id: commission.id },
        data: {
          status: "REJECTED",
          rejectedAt: new Date(),
          rejectionReason: input.reason,
        },
      });
      await recordAudit(
        {
          action: "COMMISSION_REJECTED",
          entityType: "Commission",
          entityId: commission.id,
          actor: admin,
          previousValue: { status: commission.status },
          newValue: { status: "REJECTED", reason: input.reason },
        },
        tx,
      );
      await notify(
        {
          userId: commission.affiliate.userId,
          type: "COMMISSION_REJECTED",
          params: {
            amount: (commission.commissionAmountCents / 100).toFixed(2),
            reason: input.reason,
          },
          link: "/affiliate/commissions",
          severity: "ERROR",
        },
        tx,
      );
    });

    revalidateMoney();
    return actionOk();
  } catch (error) {
    return toActionError(error);
  }
}

export async function cancelCommissionAction(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const input = parseOrThrow(commissionReasonSchema, formToObject(formData));

    const commission = await prisma.commission.findUnique({
      where: { id: input.commissionId },
      include: { affiliate: { select: { userId: true } } },
    });
    if (!commission) throw new AppError("errors.notFound");
    // A paid commission is money already sent; it cannot be cancelled.
    if (commission.status === "PAID" || commission.status === "CANCELLED") {
      throw new AppError("errors.invalidCommissionState");
    }

    await prisma.$transaction(async (tx) => {
      await tx.commission.update({
        where: { id: commission.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancellationReason: input.reason,
          payoutId: null,
        },
      });
      await recordAudit(
        {
          action: "COMMISSION_CANCELLED",
          entityType: "Commission",
          entityId: commission.id,
          actor: admin,
          previousValue: { status: commission.status },
          newValue: { status: "CANCELLED", reason: input.reason },
        },
        tx,
      );
      await notify(
        {
          userId: commission.affiliate.userId,
          type: "COMMISSION_CANCELLED",
          params: {
            amount: (commission.commissionAmountCents / 100).toFixed(2),
            reason: input.reason,
          },
          link: "/affiliate/commissions",
          severity: "WARNING",
        },
        tx,
      );
    });

    revalidateMoney();
    return actionOk();
  } catch (error) {
    return toActionError(error);
  }
}

export async function markCommissionPaidAction(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const input = parseOrThrow(commissionMarkPaidSchema, formToObject(formData));

    const commission = await prisma.commission.findUnique({
      where: { id: input.commissionId },
      include: { affiliate: { select: { userId: true } } },
    });
    if (!commission) throw new AppError("errors.notFound");
    if (commission.status !== "APPROVED") throw new AppError("errors.invalidCommissionState");

    await prisma.$transaction(async (tx) => {
      await tx.commission.update({
        where: { id: commission.id },
        data: {
          status: "PAID",
          paidAt: new Date(),
          internalNotes: input.paymentReference
            ? `${commission.internalNotes ? `${commission.internalNotes}\n` : ""}${input.paymentReference}`
            : commission.internalNotes,
        },
      });
      await recordAudit(
        {
          action: "COMMISSION_PAID",
          entityType: "Commission",
          entityId: commission.id,
          actor: admin,
          previousValue: { status: commission.status },
          newValue: { status: "PAID", paymentReference: input.paymentReference ?? null },
        },
        tx,
      );
      await notify(
        {
          userId: commission.affiliate.userId,
          type: "COMMISSION_PAID",
          params: { amount: (commission.commissionAmountCents / 100).toFixed(2) },
          link: "/affiliate/commissions",
          severity: "SUCCESS",
        },
        tx,
      );
    });

    revalidateMoney();
    return actionOk();
  } catch (error) {
    return toActionError(error);
  }
}

// ---------------------------------------------------------------------------
// Payouts
// ---------------------------------------------------------------------------

export async function approvePayoutAction(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const input = parseOrThrow(payoutActionSchema, formToObject(formData));
    await approvePayout(admin, input);
    revalidateMoney();
    return actionOk();
  } catch (error) {
    return toActionError(error);
  }
}

export async function rejectPayoutAction(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const input = parseOrThrow(payoutRejectSchema, formToObject(formData));
    await rejectPayout(admin, input);
    revalidateMoney();
    return actionOk();
  } catch (error) {
    return toActionError(error);
  }
}

export async function markPayoutPaidAction(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const input = parseOrThrow(payoutPaidSchema, formToObject(formData));
    await markPayoutPaid(admin, input);
    revalidateMoney();
    return actionOk();
  } catch (error) {
    return toActionError(error);
  }
}
