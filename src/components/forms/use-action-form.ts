"use client";

import * as React from "react";
import { toast } from "sonner";

import type { ActionResult } from "@/lib/errors";
import { useI18n } from "@/lib/i18n/provider";

type Options<T> = {
  onSuccess?: (data: T) => void | Promise<void>;
  successMessage?: string;
  /** Set to false to surface the error inline only, without a toast. */
  toastOnError?: boolean;
};

/**
 * Wraps a server action in the state every form in the app needs: pending
 * flag, translated field errors and a form-level error. Validation messages
 * arrive from the server as i18n keys and are translated here.
 */
export function useActionForm<T>(
  action: (formData: FormData) => Promise<ActionResult<T>>,
  options: Options<T> = {},
) {
  const { t } = useI18n();
  const [pending, setPending] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<string | undefined>(undefined);

  const reset = React.useCallback(() => {
    setFieldErrors({});
    setFormError(null);
    setDetail(undefined);
  }, []);

  const submit = React.useCallback(
    async (formData: FormData) => {
      setPending(true);
      reset();
      try {
        const result = await action(formData);
        if (result.ok) {
          if (options.successMessage) toast.success(options.successMessage);
          await options.onSuccess?.(result.data);
          return result;
        }

        setFieldErrors(result.fieldErrors ?? {});
        setDetail(result.detail);
        const message = t(result.error);
        setFormError(message);
        if (options.toastOnError !== false && !result.fieldErrors) {
          toast.error(message);
        }
        return result;
      } catch {
        const message = t("errors.generic");
        setFormError(message);
        if (options.toastOnError !== false) toast.error(message);
        return { ok: false as const, error: "errors.generic" as const };
      } finally {
        setPending(false);
      }
    },
    [action, options, reset, t],
  );

  const onSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      await submit(new FormData(event.currentTarget));
    },
    [submit],
  );

  return {
    pending,
    fieldErrors,
    formError,
    detail,
    onSubmit,
    submit,
    reset,
    errorFor: (name: string) => fieldErrors[name],
  };
}
