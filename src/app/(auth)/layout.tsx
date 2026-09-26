import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-x-hidden bg-void">
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-noise opacity-50" />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 -top-20 size-[18rem] rounded-full bg-violet-700/20 blur-[80px] sm:-left-32 sm:-top-32 sm:size-[30rem] sm:blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-16 size-[16rem] rounded-full bg-violet-600/14 blur-[70px] sm:-bottom-40 sm:-right-24 sm:size-[28rem] sm:blur-[110px]"
      />

      <header className="relative z-10 flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Logo className="min-w-0" />
        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitcher compact />
          <Link
            href="/"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm text-muted transition-colors hover:bg-white/5 hover:text-ink"
          >
            <ArrowLeft className="size-3.5" />
            <span className="hidden sm:inline">NexusDevStudio</span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex w-full flex-1 items-start justify-center px-4 pb-16 pt-4 sm:items-center sm:px-6 sm:pt-0">
        {children}
      </main>
    </div>
  );
}
