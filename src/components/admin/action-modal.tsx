"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { FormAlert } from "@/components/forms/form-error";
import { useActionForm } from "@/components/forms/use-action-form";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useI18n } from "@/lib/i18n/provider";
import type { ActionResult } from "@/lib/errors";

/**
 * Generic confirm-and-submit modal. Every destructive or state-changing admin
 * action goes through one of these so the interaction is consistent and always
 * explicit.
 */
export function ActionModal<T>({
  trigger,
  title,
  description,
  action,
  hiddenFields,
  children,
  confirmLabel,
  confirmVariant = "primary",
  successMessage,
  size = "sm",
  onDone,
}: {
  trigger: (open: () => void) => React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action: (formData: FormData) => Promise<ActionResult<T>>;
  hiddenFields?: Record<string, string>;
  children?: React.ReactNode | ((helpers: { errorFor: (name: string) => string | undefined }) => React.ReactNode);
  confirmLabel?: string;
  confirmVariant?: ButtonProps["variant"];
  successMessage?: string;
  size?: "sm" | "md" | "lg" | "xl";
  onDone?: (data: T) => void;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const form = useActionForm(action, {
    successMessage,
    onSuccess: (data) => {
      setOpen(false);
      onDone?.(data);
      router.refresh();
    },
  });

  return (
    <>
      {trigger(() => setOpen(true))}
      <Modal
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) form.reset();
        }}
        title={title}
        description={description}
        size={size}
      >
        <form onSubmit={form.onSubmit} className="space-y-4" noValidate>
          {Object.entries(hiddenFields ?? {}).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}

          <FormAlert
            message={
              form.formError && Object.keys(form.fieldErrors).length === 0
                ? form.formError
                : null
            }
          />

          {typeof children === "function"
            ? children({ errorFor: form.errorFor })
            : children}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant={confirmVariant} disabled={form.pending}>
              {form.pending ? t("common.saving") : (confirmLabel ?? t("common.confirm"))}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

/** Convenience wrapper for actions that require a written reason. */
export function ReasonModal<T>(props: {
  trigger: (open: () => void) => React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action: (formData: FormData) => Promise<ActionResult<T>>;
  hiddenFields?: Record<string, string>;
  confirmLabel?: string;
  confirmVariant?: ButtonProps["variant"];
  successMessage?: string;
  fieldName?: string;
}) {
  const { t } = useI18n();
  const fieldName = props.fieldName ?? "reason";

  return (
    <ActionModal {...props}>
      {({ errorFor }) => (
        <Field label={t("common.reason")} htmlFor={fieldName} required error={errorFor(fieldName)}>
          <Textarea id={fieldName} name={fieldName} rows={3} required maxLength={500} />
        </Field>
      )}
    </ActionModal>
  );
}
