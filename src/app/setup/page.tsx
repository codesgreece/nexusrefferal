import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Database, KeyRound, Rocket } from "lucide-react";

import { LogoMark } from "@/components/brand/logo";
import { isDatabaseConfigured, missingEnvVars } from "@/lib/config-state";

export const metadata: Metadata = {
  title: "Setup required",
  robots: { index: false, follow: false },
};

/**
 * Shown while the deployment has no database attached. Deliberately free of
 * database access and of invented data: it states exactly what is missing and
 * what to do about it.
 */
export default function SetupPage() {
  if (isDatabaseConfigured()) redirect("/");
  const missing = missingEnvVars();

  const steps = [
    {
      icon: <Database className="size-5" />,
      title: "Attach a PostgreSQL database",
      body: "In the Vercel dashboard open this project, go to the Storage tab and create a Postgres database (Neon and Prisma Postgres both work). Vercel writes DATABASE_URL into the project's environment variables for you.",
    },
    {
      icon: <KeyRound className="size-5" />,
      title: "Check the remaining variables",
      body: "SESSION_SECRET and NEXT_PUBLIC_APP_URL must also be set. DIRECT_URL is optional — leave it out and it falls back to DATABASE_URL.",
    },
    {
      icon: <Rocket className="size-5" />,
      title: "Redeploy",
      body: "The build runs the migrations and an idempotent seed, which creates the administrator account, the service catalogue and the program settings. This screen disappears on the next successful deployment.",
    },
  ];

  return (
    <div className="relative flex min-h-dvh w-full items-center justify-center overflow-x-hidden bg-void px-4 py-16">
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-noise opacity-50" />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 -top-20 size-[18rem] rounded-full bg-violet-700/18 blur-[80px] sm:-left-32 sm:-top-32 sm:size-[30rem] sm:blur-[120px]"
      />

      <main className="relative w-full max-w-2xl">
        <div className="flex items-center gap-3">
          <LogoMark />
          <div>
            <p className="text-[0.95rem] font-semibold tracking-tight text-ink">
              Nexus<span className="text-violet-300">Dev</span>Studio
            </p>
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-violet-400/80">
              Affiliates
            </p>
          </div>
        </div>

        <h1 className="mt-8 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Almost there — the database is not connected yet.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          The application deployed successfully. It needs a PostgreSQL database
          before it can store affiliates, leads, sales, commissions and payouts.
        </p>

        {missing.length > 0 ? (
          <div className="mt-6 rounded-2xl border border-caution/30 bg-caution/8 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-caution">
              Missing environment variables
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {missing.map((key) => (
                <li
                  key={key}
                  className="rounded-lg border border-caution/25 bg-caution/10 px-2.5 py-1 font-mono text-xs text-caution"
                >
                  {key}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <ol className="mt-8 space-y-3">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="flex gap-4 rounded-2xl border border-white/8 bg-surface/70 p-5"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-violet-500/25 bg-violet-500/10 text-violet-300">
                {step.icon}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">
                  <span className="mr-2 font-mono text-violet-400">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {step.title}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-8 text-xs leading-relaxed text-muted-2">
          Full instructions are in the repository README under “Deploying to
          Vercel”.
        </p>
      </main>
    </div>
  );
}
