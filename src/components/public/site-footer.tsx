"use client";

import Link from "next/link";
import { Mail } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { useI18n } from "@/lib/i18n/provider";

export function SiteFooter({
  contactEmail,
  termsUrl,
  privacyUrl,
}: {
  contactEmail: string;
  termsUrl: string;
  privacyUrl: string;
}) {
  const { t } = useI18n();

  return (
    <footer className="border-t border-white/8 bg-abyss">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="space-y-4 lg:col-span-2">
          <Logo />
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            {t("landing.footerTagline")}
          </p>
          <p className="max-w-sm text-xs leading-relaxed text-muted-2">
            {t("landing.commissionNoClaims")}
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300/80">
            {t("landing.footerProgram")}
          </h3>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              <Link href="/#how" className="transition-colors hover:text-ink">
                {t("nav.howItWorks")}
              </Link>
            </li>
            <li>
              <Link href="/#pricing" className="transition-colors hover:text-ink">
                {t("nav.pricing")}
              </Link>
            </li>
            <li>
              <Link href="/#faq" className="transition-colors hover:text-ink">
                {t("nav.faq")}
              </Link>
            </li>
            <li>
              <Link href="/affiliate/register" className="transition-colors hover:text-ink">
                {t("nav.register")}
              </Link>
            </li>
            <li>
              <Link href="/login" className="transition-colors hover:text-ink">
                {t("nav.login")}
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300/80">
            {t("landing.footerLegal")}
          </h3>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              <Link href={termsUrl} className="transition-colors hover:text-ink">
                {t("nav.terms")}
              </Link>
            </li>
            <li>
              <Link href={privacyUrl} className="transition-colors hover:text-ink">
                {t("nav.privacy")}
              </Link>
            </li>
            <li>
              <Link href="/contact" className="transition-colors hover:text-ink">
                {t("nav.contact")}
              </Link>
            </li>
          </ul>
          <h3 className="pt-3 text-xs font-semibold uppercase tracking-[0.16em] text-violet-300/80">
            {t("landing.footerContact")}
          </h3>
          <a
            href={`mailto:${contactEmail}`}
            className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink"
          >
            <Mail className="size-3.5" />
            {contactEmail}
          </a>
        </div>
      </div>
      <div className="border-t border-white/6 px-4 py-5 sm:px-6 lg:px-8">
        <p className="mx-auto max-w-7xl text-xs text-muted-2">
          © {new Date().getFullYear()} NexusDevStudio. {t("landing.footerRights")}
        </p>
      </div>
    </footer>
  );
}
