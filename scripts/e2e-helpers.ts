/**
 * Thin wrappers that call the real service layer from the end-to-end script,
 * so the test exercises production code paths rather than reimplementing them.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Actor = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "AFFILIATE";
  locale: string;
  affiliateId: string | null;
  affiliateStatus: string | null;
  referralCode: string | null;
};

async function actorFor(userId: string): Promise<Actor> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { affiliate: { select: { id: true, status: true } } },
  });
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as "ADMIN" | "AFFILIATE",
    locale: user.locale,
    affiliateId: user.affiliate?.id ?? null,
    affiliateStatus: user.affiliate?.status ?? null,
    referralCode: null,
  };
}

export async function confirmPaymentViaService(saleId: string, adminUserId: string) {
  const { confirmPayment } = await import("../src/lib/services/sales");
  const actor = await actorFor(adminUserId);
  const result = await confirmPayment(actor, { saleId });
  return { created: result.commission.created, alreadyPaid: result.alreadyPaid };
}

export async function refundSaleFor(saleId: string, adminUserId: string, reason: string) {
  const { refundSale } = await import("../src/lib/services/sales");
  const actor = await actorFor(adminUserId);
  await refundSale(actor, { saleId, reason });
}

export async function approveCommission(commissionId: string, adminUserId: string) {
  const { recordAudit } = await import("../src/lib/services/audit");
  const { notify } = await import("../src/lib/services/notifications");
  const actor = await actorFor(adminUserId);

  const commission = await prisma.commission.findUniqueOrThrow({
    where: { id: commissionId },
    include: { affiliate: { select: { userId: true } } },
  });
  if (commission.status !== "PENDING") throw new Error("errors.invalidCommissionState");

  await prisma.$transaction(async (tx) => {
    await tx.commission.update({
      where: { id: commission.id },
      data: { status: "APPROVED", approvedAt: new Date(), approvedById: actor.id },
    });
    await recordAudit(
      {
        action: "COMMISSION_APPROVED",
        entityType: "Commission",
        entityId: commission.id,
        actor,
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
}

export async function requestPayoutFor(affiliateId: string, affiliateUserId: string) {
  const { requestPayout } = await import("../src/lib/services/payouts");
  const actor = await actorFor(affiliateUserId);
  return requestPayout(actor, affiliateId);
}

export async function approvePayoutFor(payoutId: string, adminUserId: string) {
  const { approvePayout } = await import("../src/lib/services/payouts");
  const actor = await actorFor(adminUserId);
  await approvePayout(actor, { payoutId });
}

export async function payPayoutFor(
  payoutId: string,
  adminUserId: string,
  transactionReference: string,
) {
  const { markPayoutPaid } = await import("../src/lib/services/payouts");
  const actor = await actorFor(adminUserId);
  await markPayoutPaid(actor, { payoutId, transactionReference });
}
