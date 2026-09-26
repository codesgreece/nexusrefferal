import { z } from "zod";

import {
  ATTRIBUTION_METHODS,
  COMMISSION_TYPES,
  CUSTOMER_STATUSES,
  LEAD_STATUSES,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  PAYOUT_METHODS,
  RESOURCE_TYPES,
} from "@/lib/domain";
import { LOCALES } from "@/lib/i18n/config";
import {
  V,
  centsField,
  checkboxTrue,
  dateField,
  emailField,
  intField,
  optionalCheckbox,
  optionalPhoneField,
  optionalString,
  optionalUrlField,
  passwordField,
  percentField,
  phoneField,
  referralCodeField,
  requiredString,
} from "./helpers";

const MIN_AGE_YEARS = 18;

function isAdult(date: Date): boolean {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - MIN_AGE_YEARS);
  return date <= cutoff;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  email: emailField,
  password: z.string({ error: V.required }).min(1, V.required),
  next: z.string().optional(),
});

export const forgotPasswordSchema = z.object({ email: emailField });

export const resetPasswordSchema = z
  .object({
    token: requiredString(200),
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: V.passwordMatch,
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string({ error: V.required }).min(1, V.required),
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: V.passwordMatch,
    path: ["confirmPassword"],
  });

export const affiliateRegisterSchema = z
  .object({
    fullName: requiredString(120),
    email: emailField,
    phone: phoneField,
    dateOfBirth: dateField.refine(isAdult, V.adult),
    tiktok: optionalString(120),
    instagram: optionalString(120),
    facebook: optionalString(120),
    youtube: optionalString(120),
    bio: requiredString(1000),
    motivation: requiredString(1000),
    password: passwordField,
    confirmPassword: z.string(),
    adultConfirm: checkboxTrue(V.adult),
    acceptTerms: checkboxTrue(V.terms),
    acceptPrivacy: checkboxTrue(V.privacy),
    locale: z.enum(LOCALES).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: V.passwordMatch,
    path: ["confirmPassword"],
  })
  .refine((data) => Boolean(data.tiktok || data.instagram || data.facebook || data.youtube), {
    message: V.socialRequired,
    path: ["tiktok"],
  });

// ---------------------------------------------------------------------------
// Public lead capture
// ---------------------------------------------------------------------------

export const publicLeadSchema = z.object({
  customerName: requiredString(120),
  businessName: optionalString(120),
  email: emailField,
  phone: optionalPhoneField,
  serviceId: optionalString(40),
  message: requiredString(2000),
  referralCode: z
    .string()
    .trim()
    .optional()
    .transform((value) =>
      value ? value.toUpperCase().replace(/[^A-Z0-9]/g, "") : undefined,
    ),
});

// ---------------------------------------------------------------------------
// Affiliate self-service
// ---------------------------------------------------------------------------

export const affiliateProfileSchema = z.object({
  fullName: requiredString(120),
  phone: phoneField,
  bio: optionalString(1000),
  tiktok: optionalString(120),
  instagram: optionalString(120),
  facebook: optionalString(120),
  youtube: optionalString(120),
  locale: z.enum(LOCALES),
});

export const payoutDetailsSchema = z
  .object({
    payoutMethod: z.enum(PAYOUT_METHODS),
    payoutAccountName: optionalString(120),
    payoutIban: optionalString(60),
    payoutBankName: optionalString(120),
    payoutPaypalEmail: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value && value.length > 0 ? value.toLowerCase() : undefined)),
    payoutOtherDetails: optionalString(1000),
  })
  .superRefine((data, ctx) => {
    if (data.payoutMethod === "BANK_TRANSFER") {
      if (!data.payoutAccountName)
        ctx.addIssue({ code: "custom", message: V.required, path: ["payoutAccountName"] });
      if (!data.payoutIban)
        ctx.addIssue({ code: "custom", message: V.required, path: ["payoutIban"] });
    }
    if (data.payoutMethod === "PAYPAL") {
      if (!data.payoutPaypalEmail) {
        ctx.addIssue({ code: "custom", message: V.required, path: ["payoutPaypalEmail"] });
      } else if (!z.email().safeParse(data.payoutPaypalEmail).success) {
        ctx.addIssue({ code: "custom", message: V.email, path: ["payoutPaypalEmail"] });
      }
    }
    if (data.payoutMethod === "OTHER" && !data.payoutOtherDetails) {
      ctx.addIssue({ code: "custom", message: V.required, path: ["payoutOtherDetails"] });
    }
  });

// ---------------------------------------------------------------------------
// Admin: affiliates
// ---------------------------------------------------------------------------

export const approveAffiliateSchema = z.object({
  affiliateId: requiredString(40),
  referralCode: referralCodeField,
  internalNotes: optionalString(1000),
});

export const rejectAffiliateSchema = z.object({
  affiliateId: requiredString(40),
  reason: requiredString(500),
});

export const suspendAffiliateSchema = z.object({
  affiliateId: requiredString(40),
  reason: requiredString(500),
});

export const reactivateAffiliateSchema = z.object({
  affiliateId: requiredString(40),
});

export const changeReferralCodeSchema = z.object({
  affiliateId: requiredString(40),
  referralCode: referralCodeField,
});

export const toggleReferralCodeSchema = z.object({
  referralCodeId: requiredString(40),
  isActive: optionalCheckbox,
});

export const updateAffiliateSchema = z.object({
  affiliateId: requiredString(40),
  fullName: requiredString(120),
  phone: phoneField,
  bio: optionalString(1000),
  internalNotes: optionalString(2000),
  tiktok: optionalString(120),
  instagram: optionalString(120),
  facebook: optionalString(120),
  youtube: optionalString(120),
});

// ---------------------------------------------------------------------------
// Admin: leads
// ---------------------------------------------------------------------------

const leadCore = {
  customerName: requiredString(120),
  businessName: optionalString(120),
  email: emailField,
  phone: optionalPhoneField,
  serviceId: optionalString(40),
  message: optionalString(2000),
  status: z.enum(LEAD_STATUSES),
  estimatedAmount: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  internalNotes: optionalString(2000),
  affiliateId: optionalString(40),
  attributionMethod: z.enum(ATTRIBUTION_METHODS).optional(),
  attributionSource: optionalString(200),
  attributionNotes: optionalString(1000),
};

export const createLeadSchema = z.object(leadCore);

export const updateLeadSchema = z.object({
  leadId: requiredString(40),
  ...leadCore,
});

export const assignLeadSchema = z.object({
  leadId: requiredString(40),
  affiliateId: optionalString(40),
  attributionMethod: z.enum(ATTRIBUTION_METHODS).optional(),
  attributionSource: optionalString(200),
  attributionNotes: optionalString(1000),
});

export const leadStatusSchema = z.object({
  leadId: requiredString(40),
  status: z.enum(LEAD_STATUSES),
});

export const deleteLeadSchema = z.object({ leadId: requiredString(40) });

export const convertLeadSchema = z.object({
  leadId: requiredString(40),
  acknowledgeDuplicate: optionalCheckbox,
});

// ---------------------------------------------------------------------------
// Admin: customers
// ---------------------------------------------------------------------------

const customerCore = {
  fullName: requiredString(120),
  businessName: optionalString(120),
  email: emailField,
  phone: optionalPhoneField,
  serviceId: optionalString(40),
  affiliateId: optionalString(40),
  attributionMethod: z.enum(ATTRIBUTION_METHODS).optional(),
  source: optionalString(200),
  status: z.enum(CUSTOMER_STATUSES),
  internalNotes: optionalString(2000),
};

export const createCustomerSchema = z.object({
  ...customerCore,
  acknowledgeDuplicate: optionalCheckbox,
});

export const updateCustomerSchema = z.object({
  customerId: requiredString(40),
  ...customerCore,
});

export const deleteCustomerSchema = z.object({ customerId: requiredString(40) });

// ---------------------------------------------------------------------------
// Admin: sales
// ---------------------------------------------------------------------------

export const createSaleSchema = z.object({
  customerId: requiredString(40),
  serviceId: requiredString(40),
  amount: centsField,
  domainIncluded: optionalCheckbox,
  saleDate: dateField,
  paymentStatus: z.enum(PAYMENT_STATUSES),
  orderStatus: z.enum(ORDER_STATUSES),
  paymentReference: optionalString(120),
  internalNotes: optionalString(2000),
  leadId: optionalString(40),
});

export const updateSaleSchema = z.object({
  saleId: requiredString(40),
  serviceId: requiredString(40),
  amount: centsField,
  domainIncluded: optionalCheckbox,
  saleDate: dateField,
  orderStatus: z.enum(ORDER_STATUSES),
  paymentReference: optionalString(120),
  internalNotes: optionalString(2000),
});

export const confirmPaymentSchema = z.object({
  saleId: requiredString(40),
  paymentReference: optionalString(120),
});

export const refundSaleSchema = z.object({
  saleId: requiredString(40),
  reason: requiredString(500),
});

// ---------------------------------------------------------------------------
// Admin: commissions
// ---------------------------------------------------------------------------

export const commissionActionSchema = z.object({
  commissionId: requiredString(40),
  internalNotes: optionalString(1000),
});

export const commissionReasonSchema = z.object({
  commissionId: requiredString(40),
  reason: requiredString(500),
});

export const commissionMarkPaidSchema = z.object({
  commissionId: requiredString(40),
  paymentReference: optionalString(120),
});

// ---------------------------------------------------------------------------
// Payouts
// ---------------------------------------------------------------------------

export const requestPayoutSchema = z.object({
  confirm: checkboxTrue(V.required),
});

export const payoutActionSchema = z.object({
  payoutId: requiredString(40),
  note: optionalString(1000),
});

export const payoutRejectSchema = z.object({
  payoutId: requiredString(40),
  reason: requiredString(500),
});

export const payoutPaidSchema = z.object({
  payoutId: requiredString(40),
  transactionReference: requiredString(120),
  note: optionalString(1000),
});

// ---------------------------------------------------------------------------
// Admin: services, resources, settings
// ---------------------------------------------------------------------------

const serviceCore = {
  nameEn: requiredString(120),
  nameEl: requiredString(120),
  descriptionEn: requiredString(600),
  descriptionEl: requiredString(600),
  featuresEn: optionalString(2000),
  featuresEl: optionalString(2000),
  startingPrice: centsField,
  priceFrom: optionalCheckbox,
  commissionType: z.enum(COMMISSION_TYPES),
  commissionFixed: centsField.optional(),
  commissionPercent: percentField.optional(),
  isActive: optionalCheckbox,
  sortOrder: intField(0, 999),
};

export const createServiceSchema = z.object(serviceCore);
export const updateServiceSchema = z.object({
  serviceId: requiredString(40),
  ...serviceCore,
});

const resourceCore = {
  titleEn: requiredString(160),
  titleEl: requiredString(160),
  descriptionEn: requiredString(1000),
  descriptionEl: requiredString(1000),
  type: z.enum(RESOURCE_TYPES),
  contentEn: optionalString(5000),
  contentEl: optionalString(5000),
  url: optionalUrlField,
  thumbnailUrl: optionalUrlField,
  isActive: optionalCheckbox,
  sortOrder: intField(0, 999),
};

export const createResourceSchema = z.object(resourceCore);
export const updateResourceSchema = z.object({
  resourceId: requiredString(40),
  ...resourceCore,
});
export const deleteResourceSchema = z.object({ resourceId: requiredString(40) });

export const settingsSchema = z.object({
  programName: requiredString(120),
  programActive: optionalCheckbox,
  minPayout: centsField,
  referralCookieDays: intField(1, 365),
  domainFee: centsField,
  defaultCommissionType: z.enum(COMMISSION_TYPES),
  defaultCommissionFixed: centsField,
  defaultCommissionPercent: percentField,
  contactEmail: emailField,
  termsUrl: requiredString(200),
  privacyUrl: requiredString(200),
  paymentInstructionsEn: optionalString(4000),
  paymentInstructionsEl: optionalString(4000),
  termsContentEn: optionalString(30000),
  termsContentEl: optionalString(30000),
  privacyContentEn: optionalString(30000),
  privacyContentEl: optionalString(30000),
});
