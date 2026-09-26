import Link from "next/link";

import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl border border-violet-400/35 bg-linear-to-br from-violet-500/30 via-violet-700/20 to-transparent",
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute inset-0 bg-linear-to-br from-violet-500/40 to-transparent blur-md"
      />
      <svg viewBox="0 0 24 24" className="relative size-5 text-violet-200" aria-hidden>
        <path
          d="M5 19V5l14 14V5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Logo({
  href = "/",
  showProgram = true,
  className,
}: {
  href?: string;
  showProgram?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("group flex items-center gap-2.5 outline-none", className)}
      aria-label="NexusDevStudio Affiliates"
    >
      <LogoMark className="transition-transform duration-300 group-hover:scale-105" />
      <span className="flex flex-col leading-none">
        <span className="text-[0.95rem] font-semibold tracking-tight text-ink">
          Nexus<span className="text-violet-300">Dev</span>Studio
        </span>
        {showProgram ? (
          <span className="mt-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-violet-400/80">
            Affiliates
          </span>
        ) : null}
      </span>
    </Link>
  );
}
