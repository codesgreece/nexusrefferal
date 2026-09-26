import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) {
    redirect(user.role === "ADMIN" ? "/admin" : "/affiliate/dashboard");
  }

  const { next } = await searchParams;
  const { t } = await getI18n();

  return (
    <Card glow className="w-full max-w-md min-w-0">
      <CardHeader title={t("auth.loginTitle")} description={t("auth.loginSubtitle")} />
      <CardBody>
        <LoginForm next={next} />
      </CardBody>
    </Card>
  );
}
