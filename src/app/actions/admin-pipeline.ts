"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/guards";
import { AppError, actionOk, toActionError, type ActionResult } from "@/lib/errors";
import { formToObject, parseOrThrow } from "@/lib/validation/helpers";
import {
  assignLeadSchema,
  confirmPaymentSchema,
  convertLeadSchema,
  createCustomerSchema,
  createLeadSchema,
  createSaleSchema,
  deleteCustomerSchema,
  deleteLeadSchema,
  leadStatusSchema,
  refundSaleSchema,
  updateCustomerSchema,
  updateLeadSchema,
  updateSaleSchema,
} from "@/lib/validation/schemas";
import {
  assignLead,
  changeLeadStatus,
  createAdminLead,
  deleteLead,
  updateLead,
} from "@/lib/services/leads";
import {
  convertLeadToCustomer,
  createCustomer,
  deleteCustomer,
  findDuplicates,
  updateCustomer,
} from "@/lib/services/customers";
import { confirmPayment, createSale, refundSale, updateSale } from "@/lib/services/sales";

function revalidatePipeline() {
  revalidatePath("/admin");
  revalidatePath("/admin/leads");
  revalidatePath("/admin/customers");
  revalidatePath("/admin/sales");
  revalidatePath("/admin/commissions");
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

export async function createLeadAction(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const input = parseOrThrow(createLeadSchema, formToObject(formData));
    await createAdminLead(admin, input);
    revalidatePipeline();
    return actionOk();
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateLeadAction(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const input = parseOrThrow(updateLeadSchema, formToObject(formData));
    await updateLead(admin, input);
    revalidatePipeline();
    return actionOk();
  } catch (error) {
    return toActionError(error);
  }
}

export async function assignLeadAction(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const input = parseOrThrow(assignLeadSchema, formToObject(formData));
    await assignLead(admin, input);
    revalidatePipeline();
    return actionOk();
  } catch (error) {
    return toActionError(error);
  }
}

export async function changeLeadStatusAction(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const input = parseOrThrow(leadStatusSchema, formToObject(formData));
    await changeLeadStatus(admin, input);
    revalidatePipeline();
    return actionOk();
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteLeadAction(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const input = parseOrThrow(deleteLeadSchema, formToObject(formData));
    await deleteLead(admin, input.leadId);
    revalidatePipeline();
    return actionOk();
  } catch (error) {
    return toActionError(error);
  }
}

export async function convertLeadAction(
  formData: FormData,
): Promise<ActionResult<{ customerId: string; alreadyConverted: boolean }>> {
  try {
    const admin = await requireAdmin();
    const input = parseOrThrow(convertLeadSchema, formToObject(formData));
    const result = await convertLeadToCustomer(admin, input);
    revalidatePipeline();
    return actionOk(result);
  } catch (error) {
    return toActionError(error);
  }
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export async function checkDuplicateCustomerAction(
  email: string,
  phone?: string,
): Promise<ActionResult<Awaited<ReturnType<typeof findDuplicates>>>> {
  try {
    await requireAdmin();
    if (!email.includes("@")) return actionOk([]);
    return actionOk(await findDuplicates(email, phone));
  } catch (error) {
    return toActionError(error);
  }
}

export async function createCustomerAction(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const input = parseOrThrow(createCustomerSchema, formToObject(formData));
    await createCustomer(admin, input);
    revalidatePipeline();
    return actionOk();
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateCustomerAction(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const input = parseOrThrow(updateCustomerSchema, formToObject(formData));
    await updateCustomer(admin, input);
    revalidatePipeline();
    return actionOk();
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteCustomerAction(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const input = parseOrThrow(deleteCustomerSchema, formToObject(formData));
    await deleteCustomer(admin, input.customerId);
    revalidatePipeline();
    return actionOk();
  } catch (error) {
    return toActionError(error);
  }
}

// ---------------------------------------------------------------------------
// Sales
// ---------------------------------------------------------------------------

export async function createSaleAction(
  formData: FormData,
): Promise<ActionResult<{ commissionCreated: boolean }>> {
  try {
    const admin = await requireAdmin();
    const input = parseOrThrow(createSaleSchema, formToObject(formData));
    if (!Number.isFinite(input.amount)) throw new AppError("errors.validation");

    const result = await createSale(admin, {
      customerId: input.customerId,
      serviceId: input.serviceId,
      amountCents: input.amount,
      domainIncluded: input.domainIncluded,
      saleDate: input.saleDate,
      paymentStatus: input.paymentStatus,
      orderStatus: input.orderStatus,
      paymentReference: input.paymentReference,
      internalNotes: input.internalNotes,
      leadId: input.leadId,
    });

    revalidatePipeline();
    return actionOk({ commissionCreated: result.commission.created });
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateSaleAction(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const input = parseOrThrow(updateSaleSchema, formToObject(formData));
    await updateSale(admin, {
      saleId: input.saleId,
      serviceId: input.serviceId,
      amountCents: input.amount,
      domainIncluded: input.domainIncluded,
      saleDate: input.saleDate,
      orderStatus: input.orderStatus,
      paymentReference: input.paymentReference,
      internalNotes: input.internalNotes,
    });
    revalidatePipeline();
    return actionOk();
  } catch (error) {
    return toActionError(error);
  }
}

export async function confirmPaymentAction(
  formData: FormData,
): Promise<ActionResult<{ commissionCreated: boolean; alreadyPaid: boolean }>> {
  try {
    const admin = await requireAdmin();
    const input = parseOrThrow(confirmPaymentSchema, formToObject(formData));
    const result = await confirmPayment(admin, input);
    revalidatePipeline();
    return actionOk({
      commissionCreated: result.commission.created,
      alreadyPaid: result.alreadyPaid,
    });
  } catch (error) {
    return toActionError(error);
  }
}

export async function refundSaleAction(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const input = parseOrThrow(refundSaleSchema, formToObject(formData));
    await refundSale(admin, input);
    revalidatePipeline();
    return actionOk();
  } catch (error) {
    return toActionError(error);
  }
}
