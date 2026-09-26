"use client";

import { Link2, Share2, Ticket } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { FormAlert } from "@/components/forms/form-error";
import { useI18n } from "@/lib/i18n/provider";

export function ReferralCard({
  code,
  referralUrl,
  codeActive,
  cookieDays,
}: {
  code: string | null;
  referralUrl: string | null;
  codeActive: boolean;
  cookieDays: number;
}) {
  const { t } = useI18n();

  if (!code || !referralUrl) {
    return (
      <div className="rounded-2xl border border-white/8 bg-surface/80 p-6">
        <FormAlert tone="info" message={t("affiliate.referral.noCode")} />
      </div>
    );
  }

  const shareText = t("affiliate.referral.shareText", { code });

  const handleShare = async () => {
    const payload = {
      title: t("affiliate.referral.shareTitle"),
      text: shareText,
      url: referralUrl,
    };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch {
        // User dismissed the share sheet, or sharing is unavailable.
      }
    }
    try {
      await navigator.clipboard.writeText(`${shareText} ${referralUrl}`);
      toast.success(t("common.copied"));
    } catch {
      toast.error(t("errors.generic"));
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-violet-500/28 bg-linear-to-br from-violet-800/22 via-surface to-surface p-5 shadow-glow-sm sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 size-56 rounded-full bg-violet-600/20 blur-[70px]"
      />

      <div className="relative grid gap-5 lg:grid-cols-[1fr_1.2fr] lg:items-start">
        <div>
          <p className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-violet-300/85">
            <Ticket className="size-3.5" />
            {t("affiliate.referral.title")}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className="font-mono text-3xl font-semibold tracking-[0.18em] text-violet-100 sm:text-4xl">
              {code}
            </p>
            <CopyButton value={code} size="sm" />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {t("affiliate.referral.hint")}
          </p>
          {!codeActive ? (
            <p className="mt-3 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
              {t("affiliate.referral.disabled")}
            </p>
          ) : null}
        </div>

        <div className="space-y-3 border-t border-white/8 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <p className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-violet-300/85">
            <Link2 className="size-3.5" />
            {t("affiliate.referral.linkTitle")}
          </p>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-void/50 px-3 py-2.5">
            <code className="min-w-0 flex-1 truncate font-mono text-xs text-ink/90">
              {referralUrl}
            </code>
            <CopyButton value={referralUrl} iconOnly size="xs" />
          </div>
          <p className="text-xs leading-relaxed text-muted-2">
            {t("affiliate.referral.linkHint", { days: cookieDays })}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={handleShare}>
              <Share2 />
              {t("affiliate.quickActions.shareCode")}
            </Button>
            <CopyButton
              value={referralUrl}
              label={t("affiliate.quickActions.copyLink")}
              variant="secondary"
              size="sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
