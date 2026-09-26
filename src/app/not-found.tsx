import Link from "next/link";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getI18n } from "@/lib/i18n/server";

export default async function NotFound() {
  const { t } = await getI18n();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-void px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/8 bg-surface/80 p-8 text-center shadow-card">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-violet-500/28 bg-violet-500/10 text-violet-300">
          <Compass className="size-6" />
        </div>
        <p className="mt-5 font-mono text-4xl font-semibold text-violet-300/60">404</p>
        <h1 className="mt-2 text-lg font-semibold text-ink">{t("errors.notFound")}</h1>
        <Button asChild className="mt-6" block>
          <Link href="/">NexusDevStudio</Link>
        </Button>
      </div>
    </div>
  );
}
