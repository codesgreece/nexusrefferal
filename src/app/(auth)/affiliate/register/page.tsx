import type { Metadata } from "next";
import Link from "next/link";

import { FormAlert } from "@/components/forms/form-error";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { getI18n } from "@/lib/i18n/server";
import { getSettings } from "@/lib/services/settings";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Become an affiliate" };

export default async function RegisterPage() {
  const [{ t }, settings] = await Promise.all([getI18n(), getSettings()]);

  if (!settings.programActive) {
    return (
      <Card glow className="w-full max-w-md min-w-0">
        <CardHeader title={t("auth.registerTitle")} />
        <CardBody className="space-y-4">
          <FormAlert tone="warning" message={t("landing.programPaused")} />
          <Button asChild variant="secondary" block>
            <Link href="/">NexusDevStudio</Link>
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card glow className="my-4 w-full max-w-3xl min-w-0 overflow-hidden">
      <CardHeader
        title={t("auth.registerTitle")}
        description={t("auth.registerSubtitle")}
      />
      <CardBody>
        <RegisterForm termsUrl={settings.termsUrl} privacyUrl={settings.privacyUrl} />
      </CardBody>
    </Card>
  );
}
