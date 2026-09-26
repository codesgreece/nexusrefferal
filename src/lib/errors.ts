/**
 * Error keys are i18n dictionary keys, never raw database messages. Anything
 * that escapes to the client goes through `toActionError`.
 */
export type ErrorKey =
  | "errors.generic"
  | "errors.unauthorized"
  | "errors.forbidden"
  | "errors.notFound"
  | "errors.validation"
  | "errors.rateLimited"
  | "errors.invalidCredentials"
  | "errors.accountInactive"
  | "errors.emailTaken"
  | "errors.referralCodeInvalid"
  | "errors.referralCodeTaken"
  | "errors.referralCodeInactive"
  | "errors.duplicateCustomer"
  | "errors.duplicateCommission"
  | "errors.invalidPaymentState"
  | "errors.invalidCommissionState"
  | "errors.invalidPayoutState"
  | "errors.payoutBelowMinimum"
  | "errors.noApprovedCommissions"
  | "errors.payoutDetailsMissing"
  | "errors.programPaused"
  | "errors.affiliateNotApproved"
  | "errors.selfReferral"
  | "errors.resetTokenInvalid"
  | "errors.passwordMismatch"
  | "errors.currentPasswordWrong"
  | "errors.saleNotPaid"
  | "errors.serviceInactive"
  | "errors.cannotDeleteWithSales";

export class AppError extends Error {
  readonly key: ErrorKey;
  readonly fieldErrors?: Record<string, string>;
  readonly detail?: string;

  constructor(
    key: ErrorKey,
    options?: { fieldErrors?: Record<string, string>; detail?: string },
  ) {
    super(key);
    this.name = "AppError";
    this.key = key;
    this.fieldErrors = options?.fieldErrors;
    this.detail = options?.detail;
  }
}

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: ErrorKey;
      fieldErrors?: Record<string, string>;
      detail?: string;
    };

export function actionOk(): ActionResult<undefined>;
export function actionOk<T>(data: T): ActionResult<T>;
export function actionOk<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data };
}

export function actionFail(
  error: ErrorKey,
  fieldErrors?: Record<string, string>,
  detail?: string,
): ActionResult<never> {
  return { ok: false, error, fieldErrors, detail };
}

/** Converts any thrown value into a safe, translatable action result. */
export function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof AppError) {
    return {
      ok: false,
      error: error.key,
      fieldErrors: error.fieldErrors,
      detail: error.detail,
    };
  }
  // Never leak driver/ORM internals to the browser.
  console.error("[unhandled action error]", error);
  return { ok: false, error: "errors.generic" };
}
