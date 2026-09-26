import type { Metadata } from "next";

import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { getI18n } from "@/lib/i18n/server";
import { ForgotPasswordForm } from "./forgot-form";

export const metadata: Metadata = { title: "Reset password" };

export default async function ForgotPasswordPage() {
  const { t } = await getI18n();

  return (
    <Card glow className="w-full max-w-md">
      <CardHeader title={t("auth.forgotTitle")} description={t("auth.forgotSubtitle")} />
      <CardBody>
        <ForgotPasswordForm />
      </CardBody>
    </Card>
  );
}
