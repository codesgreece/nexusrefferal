import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { like } from "./query";
import { AppError } from "@/lib/errors";
import type { OrderStatus, PaymentStatus } from "@/lib/domain";
import type { SessionUser } from "@/lib/auth/session";
import { recordAudit } from "./audit";
import { notify, notifyAdmins } from "./notifications";
import { nextReference } from "./references";
import { cancelCommissionForSale, generateCommissionForSale } from "./commissions";
import { getSettings } from "./settings";

export type CreateSaleInput = {
  customerId: string;
  serviceId: string;
  amountCents: number;
  domainIncluded: boolean;
  saleDate: Date;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paymentReference?: string;
  internalNotes?: string;
  leadId?: string;
};

/**
 * Creates a sale. Attribution is copied from the customer record — never from
 * the request — so an affiliate id cannot be injected from the client.
 *
 * If the sale is created already marked PAID, the commission is generated in
 * the same transaction so the two can never diverge.
 */
export async function createSale(actor: SessionUser, input: CreateSaleInput) {
  const customer = await prisma.customer.findUnique({
    where: { id: input.customerId },
    include: { affiliate: { select: { id: true, status: true } } },
  });
  if (!customer || customer.deletedAt) throw new AppError("errors.notFound");

  const service = await prisma.service.findUnique({ where: { id: input.serviceId } });
  if (!service) throw new AppError("errors.notFound");

  const settings = await getSettings();
  const domainFeeCents = input.domainIncluded ? settings.domainFeeCents : 0;

  const attributionMethod = customer.affiliateId
    ? (
        await prisma.lead.findFirst({
          where: { customerId: customer.id, affiliateId: customer.affiliateId },
          orderBy: { createdAt: "asc" },
          select: { attributionMethod: true },
        })
      )?.attributionMethod ?? "MANUAL"
    : null;

  const result = await prisma.$transaction(async (tx) => {
    const reference = await nextReference("SL", tx);
    const sale = await tx.sale.create({
      data: {
        reference,
        customerId: customer.id,
        leadId: input.leadId ?? null,
        serviceId: service.id,
        affiliateId: customer.affiliateId,
        referralCodeId: customer.referralCodeId,
        referralCode: customer.referralCode,
        attributionMethod,
        amountCents: input.amountCents,
        domainIncluded: input.domainIncluded,
        domainFeeCents,
        saleDate: input.saleDate,
        paymentStatus: input.paymentStatus,
        orderStatus: input.orderStatus,
        paymentConfirmedAt: input.paymentStatus === "PAID" ? new Date() : null,
        paymentReference: input.paymentReference ?? null,
        internalNotes: input.internalNotes ?? null,
        createdByUserId: actor.id,
      },
    });

    if (input.leadId) {
      await tx.lead.update({
        where: { id: input.leadId },
        data: { status: "WON", customerId: customer.id },
      });
    }

    await recordAudit(
      {
        action: "SALE_CREATED",
        entityType: "Sale",
        entityId: sale.id,
        actor,
        newValue: {
          reference,
          customerId: customer.id,
          serviceId: service.id,
          amountCents: input.amountCents,
          domainFeeCents,
          paymentStatus: input.paymentStatus,
          orderStatus: input.orderStatus,
          affiliateId: customer.affiliateId,
          referralCode: customer.referralCode,
        },
      },
      tx,
    );

    await notifyAdmins(
      {
        type: "ADMIN_NEW_SALE",
        params: {
          customer: customer.fullName,
          service: service.nameEn,
          amount: ((input.amountCents + domainFeeCents) / 100).toFixed(2),
        },
        link: "/admin/sales",
        severity: "INFO",
      },
      tx,
    );

    let commission: { created: boolean; commissionId: string | null } = {
      created: false,
      commissionId: null,
    };

    if (input.paymentStatus === "PAID") {
      await recordAudit(
        {
          action: "PAYMENT_CONFIRMED",
          entityType: "Sale",
          entityId: sale.id,
          actor,
          newValue: { paymentStatus: "PAID", paymentReference: input.paymentReference ?? null },
        },
        tx,
      );
      commission = await generateCommissionForSale(tx, sale.id, actor);
      await notifyAffiliateOfSale(tx, sale.id);
    }

    return { sale, commission };
  });

  return result;
}

async function notifyAffiliateOfSale(tx: Prisma.TransactionClient, saleId: string) {
  const sale = await tx.sale.findUnique({
    where: { id: saleId },
    include: {
      affiliate: { select: { userId: true, status: true } },
      customer: { select: { fullName: true } },
      service: { select: { nameEn: true } },
    },
  });
  if (!sale?.affiliate || sale.affiliate.status !== "ACTIVE") return;

  await notify(
    {
      userId: sale.affiliate.userId,
      type: "SALE_CONFIRMED",
      params: {
        customer: sale.customer.fullName,
        service: sale.service.nameEn,
        amount: ((sale.amountCents + sale.domainFeeCents) / 100).toFixed(2),
      },
      link: "/affiliate/sales",
      severity: "SUCCESS",
    },
    tx,
  );
}

export async function updateSale(
  actor: SessionUser,
  input: {
    saleId: string;
    serviceId: string;
    amountCents: number;
    domainIncluded: boolean;
    saleDate: Date;
    orderStatus: OrderStatus;
    paymentReference?: string;
    internalNotes?: string;
  },
) {
  const sale = await prisma.sale.findUnique({
    where: { id: input.saleId },
    include: { commission: { select: { id: true, status: true } } },
  });
  if (!sale || sale.deletedAt) throw new AppError("errors.notFound");

  // Once a commission exists the commission base is frozen: changing the
  // amount would silently change what the affiliate is owed.
  const amountLocked = Boolean(sale.commission);
  const settings = await getSettings();

  await prisma.$transaction(async (tx) => {
    await tx.sale.update({
      where: { id: sale.id },
      data: {
        serviceId: amountLocked ? sale.serviceId : input.serviceId,
        amountCents: amountLocked ? sale.amountCents : input.amountCents,
        domainIncluded: input.domainIncluded,
        domainFeeCents: input.domainIncluded ? settings.domainFeeCents : 0,
        saleDate: input.saleDate,
        orderStatus: input.orderStatus,
        paymentReference: input.paymentReference ?? null,
        internalNotes: input.internalNotes ?? null,
      },
    });

    await recordAudit(
      {
        action: "SALE_UPDATED",
        entityType: "Sale",
        entityId: sale.id,
        actor,
        previousValue: {
          serviceId: sale.serviceId,
          amountCents: sale.amountCents,
          orderStatus: sale.orderStatus,
          domainIncluded: sale.domainIncluded,
        },
        newValue: {
          serviceId: amountLocked ? sale.serviceId : input.serviceId,
          amountCents: amountLocked ? sale.amountCents : input.amountCents,
          orderStatus: input.orderStatus,
          domainIncluded: input.domainIncluded,
          amountLocked,
        },
      },
      tx,
    );

    if (input.orderStatus === "CANCELLED" && sale.commission) {
      await cancelCommissionForSale(tx, sale.id, "Order cancelled", actor);
    }
  });

  return { amountLocked };
}

/**
 * Confirms payment and generates the commission in one transaction. Calling it
 * twice is safe: the second call sees PAID and returns without side effects.
 */
export async function confirmPayment(
  actor: SessionUser,
  input: { saleId: string; paymentReference?: string },
) {
  const sale = await prisma.sale.findUnique({ where: { id: input.saleId } });
  if (!sale || sale.deletedAt) throw new AppError("errors.notFound");
  if (sale.paymentStatus === "PAID") {
    return { alreadyPaid: true, commission: { created: false, commissionId: null } };
  }
  if (sale.paymentStatus !== "PENDING") throw new AppError("errors.invalidPaymentState");
  if (sale.orderStatus === "CANCELLED") throw new AppError("errors.invalidPaymentState");

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.sale.updateMany({
      where: { id: sale.id, paymentStatus: "PENDING" },
      data: {
        paymentStatus: "PAID",
        paymentConfirmedAt: new Date(),
        ...(input.paymentReference ? { paymentReference: input.paymentReference } : {}),
      },
    });
    // Guarded update: if another request already flipped the status, stop here.
    if (updated.count === 0) {
      return { alreadyPaid: true, commission: { created: false, commissionId: null } };
    }

    await recordAudit(
      {
        action: "PAYMENT_CONFIRMED",
        entityType: "Sale",
        entityId: sale.id,
        actor,
        previousValue: { paymentStatus: sale.paymentStatus },
        newValue: {
          paymentStatus: "PAID",
          paymentReference: input.paymentReference ?? sale.paymentReference,
        },
      },
      tx,
    );

    const commission = await generateCommissionForSale(tx, sale.id, actor);
    await notifyAffiliateOfSale(tx, sale.id);
    return { alreadyPaid: false, commission };
  });

  return result;
}

export async function refundSale(
  actor: SessionUser,
  input: { saleId: string; reason: string },
) {
  const sale = await prisma.sale.findUnique({ where: { id: input.saleId } });
  if (!sale || sale.deletedAt) throw new AppError("errors.notFound");
  if (sale.paymentStatus !== "PAID") throw new AppError("errors.invalidPaymentState");

  await prisma.$transaction(async (tx) => {
    await tx.sale.update({
      where: { id: sale.id },
      data: { paymentStatus: "REFUNDED", orderStatus: "CANCELLED" },
    });
    await recordAudit(
      {
        action: "PAYMENT_REFUNDED",
        entityType: "Sale",
        entityId: sale.id,
        actor,
        previousValue: { paymentStatus: sale.paymentStatus },
        newValue: { paymentStatus: "REFUNDED", reason: input.reason },
      },
      tx,
    );
    await cancelCommissionForSale(tx, sale.id, input.reason, actor);
  });
}

export type SaleFilters = {
  query?: string;
  paymentStatus?: PaymentStatus | "ALL";
  orderStatus?: OrderStatus | "ALL";
  affiliateId?: string | "ALL";
  serviceId?: string | "ALL";
  from?: string;
  to?: string;
  page?: number;
  perPage?: number;
};

export async function listSales(filters: SaleFilters, scopedAffiliateId?: string) {
  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(100, Math.max(5, filters.perPage ?? 20));
  const query = filters.query?.trim();

  const where: Prisma.SaleWhereInput = { deletedAt: null };
  if (scopedAffiliateId) where.affiliateId = scopedAffiliateId;
  else if (filters.affiliateId && filters.affiliateId !== "ALL") {
    where.affiliateId = filters.affiliateId === "NONE" ? null : filters.affiliateId;
  }
  if (filters.paymentStatus && filters.paymentStatus !== "ALL") {
    where.paymentStatus = filters.paymentStatus;
  }
  if (filters.orderStatus && filters.orderStatus !== "ALL") {
    where.orderStatus = filters.orderStatus;
  }
  if (filters.serviceId && filters.serviceId !== "ALL") where.serviceId = filters.serviceId;
  if (filters.from || filters.to) {
    where.saleDate = {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: new Date(`${filters.to}T23:59:59.999Z`) } : {}),
    };
  }
  if (query) {
    where.OR = [
      { reference: like(query) },
      { referralCode: like(query) },
      { customer: { fullName: like(query) } },
      { customer: { businessName: like(query) } },
      { customer: { email: like(query) } },
    ];
  }

  const [total, rows, sums] = await Promise.all([
    prisma.sale.count({ where }),
    prisma.sale.findMany({
      where,
      include: {
        customer: { select: { id: true, fullName: true, businessName: true } },
        service: { select: { nameEn: true, nameEl: true } },
        affiliate: { select: { id: true, fullName: true } },
        commission: {
          select: { id: true, commissionAmountCents: true, status: true },
        },
      },
      orderBy: { saleDate: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.sale.aggregate({
      where,
      _sum: { amountCents: true, domainFeeCents: true },
    }),
  ]);

  return {
    total,
    page,
    perPage,
    pages: Math.max(1, Math.ceil(total / perPage)),
    rows,
    totalAmountCents: (sums._sum.amountCents ?? 0) + (sums._sum.domainFeeCents ?? 0),
  };
}
