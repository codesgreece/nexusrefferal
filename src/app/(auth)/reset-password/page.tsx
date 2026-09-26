import type { Metadata } from "next";

import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { getI18n } from "@/lib/i18n/server";
import { ResetPasswordForm } from "./reset-form";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const { t } = await getI18n();

  return (
    <Card glow className="w-full max-w-md">
      <CardHeader title={t("auth.resetTitle")} description={t("auth.resetSubtitle")} />
      <CardBody>
        <ResetPasswordForm token={token ?? ""} />
      </CardBody>
    </Card>
  );
}
