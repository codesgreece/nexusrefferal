/**
 * Domain vocabulary. SQLite has no native enums, so these string unions are the
 * single source of truth and every write path validates against them.
 */

export const ROLES = ["ADMIN", "AFFILIATE"] as const;
export type Role = (typeof ROLES)[number];

export const AFFILIATE_STATUSES = [
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
  "REJECTED",
] as const;
export type AffiliateStatus = (typeof AFFILIATE_STATUSES)[number];

export const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL",
  "WON",
  "LOST",
  "CANCELLED",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** Leads in these states count as "qualified" for affiliate analytics. */
export const QUALIFIED_LEAD_STATUSES: LeadStatus[] = [
  "QUALIFIED",
  "PROPOSAL",
  "WON",
];

export const CUSTOMER_STATUSES = ["ACTIVE", "INACTIVE", "BLOCKED"] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "PENDING",
  "PAID",
  "REFUNDED",
  "CANCELLED",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const ORDER_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "DELIVERED",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const COMMISSION_STATUSES = [
  "PENDING",
  "APPROVED",
  "PAID",
  "REJECTED",
  "CANCELLED",
] as const;
export type CommissionStatus = (typeof COMMISSION_STATUSES)[number];

export const PAYOUT_STATUSES = [
  "REQUESTED",
  "APPROVED",
  "PAID",
  "REJECTED",
] as const;
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];

export const ATTRIBUTION_METHODS = [
  "REFERRAL_CODE",
  "REFERRAL_LINK",
  "MANUAL",
  "TIKTOK",
  "INSTAGRAM",
  "FACEBOOK",
  "DM",
  "COMMENT",
  "WHATSAPP",
  "PHONE",
  "OTHER",
] as const;
export type AttributionMethod = (typeof ATTRIBUTION_METHODS)[number];

export const COMMISSION_TYPES = ["FIXED", "PERCENT"] as const;
export type CommissionType = (typeof COMMISSION_TYPES)[number];

export const PAYOUT_METHODS = ["BANK_TRANSFER", "PAYPAL", "OTHER"] as const;
export type PayoutMethod = (typeof PAYOUT_METHODS)[number];

export const SOCIAL_PLATFORMS = [
  "TIKTOK",
  "INSTAGRAM",
  "FACEBOOK",
  "YOUTUBE",
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const RESOURCE_TYPES = [
  "IDEA",
  "SCRIPT",
  "CAPTION",
  "IMAGE",
  "VIDEO",
  "LOGO",
  "BRAND_ASSET",
  "OFFER",
  "GUIDELINE",
] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const NOTIFICATION_TYPES = [
  "AFFILIATE_APPROVED",
  "AFFILIATE_REJECTED",
  "AFFILIATE_SUSPENDED",
  "AFFILIATE_REACTIVATED",
  "LEAD_ATTRIBUTED",
  "SALE_CONFIRMED",
  "COMMISSION_CREATED",
  "COMMISSION_APPROVED",
  "COMMISSION_PAID",
  "COMMISSION_REJECTED",
  "COMMISSION_CANCELLED",
  "PAYOUT_REQUESTED",
  "PAYOUT_APPROVED",
  "PAYOUT_PAID",
  "PAYOUT_REJECTED",
  "ADMIN_NEW_APPLICATION",
  "ADMIN_NEW_LEAD",
  "ADMIN_NEW_SALE",
  "ADMIN_PAYOUT_REQUEST",
  "REFERRAL_CODE_CHANGED",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const AUDIT_ACTIONS = [
  "AFFILIATE_APPLIED",
  "AFFILIATE_APPROVED",
  "AFFILIATE_REJECTED",
  "AFFILIATE_SUSPENDED",
  "AFFILIATE_REACTIVATED",
  "AFFILIATE_UPDATED",
  "REFERRAL_CODE_CREATED",
  "REFERRAL_CODE_CHANGED",
  "REFERRAL_CODE_DISABLED",
  "REFERRAL_CODE_ENABLED",
  "LEAD_CREATED",
  "LEAD_UPDATED",
  "LEAD_ASSIGNED",
  "LEAD_REASSIGNED",
  "LEAD_STATUS_CHANGED",
  "LEAD_DELETED",
  "CUSTOMER_CREATED",
  "CUSTOMER_UPDATED",
  "CUSTOMER_DELETED",
  "SALE_CREATED",
  "SALE_UPDATED",
  "PAYMENT_CONFIRMED",
  "PAYMENT_REFUNDED",
  "COMMISSION_CREATED",
  "COMMISSION_APPROVED",
  "COMMISSION_REJECTED",
  "COMMISSION_CANCELLED",
  "COMMISSION_PAID",
  "PAYOUT_REQUESTED",
  "PAYOUT_APPROVED",
  "PAYOUT_REJECTED",
  "PAYOUT_PAID",
  "SETTINGS_CHANGED",
  "SERVICE_CREATED",
  "SERVICE_UPDATED",
  "RESOURCE_CREATED",
  "RESOURCE_UPDATED",
  "RESOURCE_DELETED",
  "LOGIN_SUCCEEDED",
  "LOGIN_FAILED",
  "PASSWORD_RESET_REQUESTED",
  "PASSWORD_RESET_COMPLETED",
  "PAYOUT_DETAILS_UPDATED",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export function isOneOf<T extends readonly string[]>(
  values: T,
  candidate: unknown,
): candidate is T[number] {
  return typeof candidate === "string" && (values as readonly string[]).includes(candidate);
}
