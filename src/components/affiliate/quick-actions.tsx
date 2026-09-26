"use client";

import Link from "next/link";
import {
  BookOpen,
  Coins,
  Link2,
  ListChecks,
  Share2,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { useI18n } from "@/lib/i18n/provider";

export function QuickActions({
  code,
  referralUrl,
}: {
  code: string | null;
  referralUrl: string | null;
}) {
  const { t } = useI18n();

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t("common.copied"));
    } catch {
      toast.error(t("errors.generic"));
    }
  };

  const share = async () => {
    if (!code || !referralUrl) return;
    const text = t("affiliate.referral.shareText", { code });
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: t("affiliate.referral.shareTitle"),
          text,
          url: referralUrl,
        });
        return;
      } catch {
        // Share sheet dismissed.
      }
    }
    await copy(`${text} ${referralUrl}`);
  };

  const actions: Array<{
    label: string;
    icon: React.ReactNode;
    href?: string;
    onClick?: () => void;
    disabled?: boolean;
  }> = [
    {
      label: t("affiliate.quickActions.shareCode"),
      icon: <Share2 />,
      onClick: share,
      disabled: !code,
    },
    {
      label: t("affiliate.quickActions.copyLink"),
      icon: <Link2 />,
      onClick: () => referralUrl && copy(referralUrl),
      disabled: !referralUrl,
    },
    { label: t("affiliate.quickActions.viewLeads"), icon: <ListChecks />, href: "/affiliate/leads" },
    {
      label: t("affiliate.quickActions.viewSales"),
      icon: <ShoppingBag />,
      href: "/affiliate/sales",
    },
    {
      label: t("affiliate.nav.commissions"),
      icon: <Coins />,
      href: "/affiliate/commissions",
    },
    {
      label: t("affiliate.quickActions.requestPayout"),
      icon: <Wallet />,
      href: "/affiliate/payouts",
    },
    {
      label: t("affiliate.quickActions.viewResources"),
      icon: <BookOpen />,
      href: "/affiliate/resources",
    },
  ];

  const base =
    "group flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.025] px-3.5 py-3 text-left text-sm text-muted transition-all hover:-translate-y-0.5 hover:border-violet-500/35 hover:text-ink disabled:pointer-events-none disabled:opacity-40";
  const iconWrap =
    "grid size-8 shrink-0 place-items-center rounded-lg border border-violet-500/25 bg-violet-500/10 text-violet-300 [&_svg]:size-4";

  return (
    <div className="rounded-2xl border border-white/8 bg-surface/80 p-5 shadow-card">
      <h3 className="mb-4 text-sm font-semibold text-ink">
        {t("affiliate.quickActions.title")}
      </h3>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {actions.map((action) =>
          action.href ? (
            <Link key={action.label} href={action.href} className={base}>
              <span className={iconWrap}>{action.icon}</span>
              <span className="truncate">{action.label}</span>
            </Link>
          ) : (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              disabled={action.disabled}
              className={base}
            >
              <span className={iconWrap}>{action.icon}</span>
              <span className="truncate">{action.label}</span>
            </button>
          ),
        )}
      </div>
    </div>
  );
}
