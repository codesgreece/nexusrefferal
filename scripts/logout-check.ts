/**
 * Verifies that signing out genuinely destroys the session server-side, by
 * invoking the sign-out server action over HTTP exactly as the browser does.
 *
 * The action id is read from the built client chunks, so it stays correct if
 * the action is ever moved or renamed.
 *
 * Usage: npx tsx --conditions=react-server scripts/logout-check.ts
 */
import { createHash, randomBytes } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

const BASE = (process.env.E2E_BASE_URL ?? "http://127.0.0.1:43711").replace(/\/$/, "");
const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) {
    passed += 1;
    console.log(`  ✔ ${label}`);
  } else {
    failed += 1;
    console.error(`  ✘ ${label}`, detail ?? "");
  }
}

const ACTION_PATTERN = /"([0-9a-f]{20,})",[^)]{0,120}?"logoutAction"/;

/** Reads the action id out of the locally built client chunks. */
function findLogoutActionIdLocally(): string | null {
  const dir = ".next/static/chunks";
  for (const entry of readdirSync(dir)) {
    if (!entry.endsWith(".js")) continue;
    const match = ACTION_PATTERN.exec(readFileSync(join(dir, entry), "utf8"));
    if (match) return match[1];
  }
  return null;
}

/**
 * Reads the action id out of the chunks the deployment actually serves. Action
 * ids are build-specific, so checking a remote target has to use its own
 * bundle rather than the local one.
 */
async function findLogoutActionIdRemotely(cookie: string): Promise<string | null> {
  const page = await fetch(`${BASE}/admin`, { headers: { cookie } });
  const html = await page.text();
  // Next 16 serves client chunks from /_next/static/immutable/chunks/.
  const chunks = new Set(
    [...html.matchAll(/\/_next\/static\/[A-Za-z0-9._~/-]+?\.js/g)].map((m) => m[0]),
  );
  for (const chunk of chunks) {
    const response = await fetch(`${BASE}${chunk}`);
    if (!response.ok) continue;
    const match = ACTION_PATTERN.exec(await response.text());
    if (match) return match[1];
  }
  return null;
}

function parseSetCookie(response: Response) {
  const jar = new Map<string, { value: string; expired: boolean }>();
  for (const raw of response.headers.getSetCookie()) {
    const [pair, ...attrs] = raw.split(";");
    const index = pair.indexOf("=");
    if (index < 1) continue;
    const attrText = attrs.join(";").toLowerCase();
    jar.set(pair.slice(0, index).trim(), {
      value: pair.slice(index + 1).trim(),
      expired:
        attrText.includes("max-age=0") ||
        attrText.includes("expires=thu, 01 jan 1970"),
    });
  }
  return jar;
}

async function main() {
  console.log(`Sign-out verification against ${BASE}\n`);

  const admin = await prisma.user.findFirstOrThrow({ where: { role: "ADMIN" } });
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await prisma.session.create({
    data: { tokenHash, userId: admin.id, expiresAt: new Date(Date.now() + 3_600_000) },
  });
  const cookie = `nds_session=${token}`;

  const actionId =
    (await findLogoutActionIdRemotely(cookie)) ?? findLogoutActionIdLocally();
  if (!actionId) throw new Error("logoutAction id not found in the served bundle");
  console.log(`  action id: ${actionId}\n`);

  console.log("Before signing out");
  const before = await fetch(`${BASE}/admin`, { headers: { cookie }, redirect: "manual" });
  check("session grants access to /admin", before.status === 200, before.status);
  check(
    "session row exists",
    (await prisma.session.count({ where: { tokenHash } })) === 1,
  );

  console.log("\nInvoking the sign-out action");
  const response = await fetch(`${BASE}/admin`, {
    method: "POST",
    redirect: "manual",
    headers: {
      cookie,
      "Next-Action": actionId,
      "content-type": "text/plain;charset=UTF-8",
      origin: BASE,
    },
    body: "[]",
  });
  check(
    "action responded without an error status",
    response.status >= 200 && response.status < 400,
    response.status,
  );

  const jar = parseSetCookie(response);
  const sessionCookie = jar.get("nds_session");
  check(
    "response clears the session cookie",
    Boolean(sessionCookie) && (sessionCookie!.expired || sessionCookie!.value === ""),
    sessionCookie,
  );

  console.log("\nAfter signing out");
  check(
    "session row was deleted",
    (await prisma.session.count({ where: { tokenHash } })) === 0,
  );

  const after = await fetch(`${BASE}/admin`, { headers: { cookie }, redirect: "manual" });
  const location = after.headers.get("location") ?? "";
  check(
    "the old cookie no longer grants access",
    after.status === 307 && location.includes("/login"),
    `${after.status} ${location}`,
  );

  const affiliateAfter = await fetch(`${BASE}/affiliate/dashboard`, {
    headers: { cookie },
    redirect: "manual",
  });
  check(
    "the old cookie is rejected on affiliate pages too",
    affiliateAfter.status === 307 &&
      (affiliateAfter.headers.get("location") ?? "").includes("/login"),
    affiliateAfter.status,
  );

  console.log("\nRendered markup");
  const loginPage = await fetch(`${BASE}/login`);
  check("login page renders", loginPage.status === 200);

  await prisma.session.deleteMany({ where: { tokenHash } });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
