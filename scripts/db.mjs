#!/usr/bin/env node
/**
 * Database steps for builds, made tolerant of partial configuration.
 *
 * - `generate` always succeeds. Prisma only needs a syntactically valid URL to
 *   emit the client, so a placeholder is used when none is configured. This
 *   keeps a deployment from failing outright before a database is attached.
 * - `deploy` applies migrations and runs the idempotent seed, but only when a
 *   real DATABASE_URL exists. Without one it warns and exits cleanly; the app
 *   then shows its setup screen instead of returning a build error.
 *
 * DIRECT_URL defaults to DATABASE_URL, so providers without a connection
 * pooler need to configure only one variable.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const PLACEHOLDER = "postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder";
const command = process.argv[2];

/**
 * Loads .env files the way the Prisma CLI and Next.js do, so a local build
 * behaves the same as a hosted one where the variables are already exported.
 */
function loadDotEnv() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key] !== undefined) continue;
      process.env[key] = rawValue.replace(/^["']|["']$/g, "");
    }
  }
}

loadDotEnv();

const hasDatabase = Boolean(process.env.DATABASE_URL?.startsWith("postgres"));
const env = { ...process.env };

if (!hasDatabase) env.DATABASE_URL = PLACEHOLDER;
if (!env.DIRECT_URL?.startsWith("postgres")) env.DIRECT_URL = env.DATABASE_URL;

function run(args) {
  const result = spawnSync("npx", ["--no-install", "prisma", ...args], {
    stdio: "inherit",
    env,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

switch (command) {
  case "generate":
    run(["generate"]);
    break;

  case "deploy":
    if (!hasDatabase) {
      console.warn(
        "\n[db] DATABASE_URL is not set — skipping migrations and seed.\n" +
          "[db] The app will render its setup screen until a PostgreSQL database is configured.\n",
      );
      break;
    }
    run(["migrate", "deploy"]);
    run(["db", "seed"]);
    break;

  default:
    console.error(`Unknown command: ${command}. Use "generate" or "deploy".`);
    process.exit(1);
}
