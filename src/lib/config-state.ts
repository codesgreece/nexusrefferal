/**
 * Whether the deployment has a real database attached. Used to serve a setup
 * screen instead of letting every page fail once it queries Prisma.
 */
export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  if (!url) return false;
  if (!url.startsWith("postgres")) return false;
  // The build script substitutes this when nothing is configured.
  return !url.includes("placeholder");
}

export function missingEnvVars(): string[] {
  const required = ["DATABASE_URL", "SESSION_SECRET", "NEXT_PUBLIC_APP_URL"];
  return required.filter((key) => !process.env[key]);
}
