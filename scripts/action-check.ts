/**
 * Exercises the administrator server actions over HTTP with a real session,
 * the same way the browser does, so the checks cover the action boundary
 * (authorization, validation, multipart decoding) and not just the services.
 *
 * Action ids are build-specific, so they are read from the bundle the target
 * actually serves.
 *
 * Usage: npx tsx --conditions=react-server scripts/action-check.ts
 */
import { createHash, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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

/** Maps exported action names to the ids the served bundle uses. */
async function loadActionIds(names: string[], cookie: string) {
  const html = await (await fetch(`${BASE}/admin/applications`, { headers: { cookie } })).text();
  const chunkPaths = new Set(
    [...html.matchAll(/\/_next\/static\/[A-Za-z0-9._~/-]+?\.js/g)].map((m) => m[0]),
  );

  const sources: string[] = [];
  for (const path of chunkPaths) {
    const response = await fetch(`${BASE}${path}`);
    if (response.ok) sources.push(await response.text());
  }

  const ids = new Map<string, string>();
  for (const name of names) {
    for (const source of sources) {
      const match = new RegExp(`"([0-9a-f]{20,})",[^)]{0,200}?"${name}"`).exec(source);
      if (match) {
        ids.set(name, match[1]);
        break;
      }
    }
  }
  return ids;
}

/**
 * Posts to a server action endpoint with an argument list that decodes to an
 * empty FormData.
 *
 * React's reply format for programmatic calls is an internal wire format, so
 * this harness does not try to pass real field values through it. What it does
 * assert is everything that happens before the payload matters: that the route
 * accepts the action, that authorization is enforced, and that validation
 * rejects the request rather than the action proceeding. Business outcomes are
 * covered against the service layer in scripts/e2e-flow.ts.
 */
async function callAction(actionId: string, cookie: string) {
  const body = new FormData();
  body.append("0", JSON.stringify(["$K1"]));

  const response = await fetch(`${BASE}/admin/applications`, {
    method: "POST",
    redirect: "manual",
    headers: { cookie, "Next-Action": actionId, origin: BASE },
    body,
  });
  return { status: response.status, body: await response.text() };
}

async function main() {
  console.log(`Admin action verification against ${BASE}\n`);

  const admin = await prisma.user.findFirstOrThrow({ where: { role: "ADMIN" } });
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await prisma.session.create({
    data: { tokenHash, userId: admin.id, expiresAt: new Date(Date.now() + 3_600_000) },
  });
  const cookie = `nds_session=${token}`;

  const ids = await loadActionIds(
    ["approveAffiliateAction", "suspendAffiliateAction", "changeReferralCodeAction"],
    cookie,
  );
  for (const [name, id] of ids) console.log(`  ${name} → ${id}`);
  console.log();

  const approveId = ids.get("approveAffiliateAction");
  if (!approveId) throw new Error("approveAffiliateAction id not found in the served bundle");

  // A throwaway pending application to approve.
  const stamp = Date.now();
  const email = `actioncheck.${stamp}@example.com`;
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash("action-check-password", 10),
      role: "AFFILIATE",
      name: "Action Check",
      locale: "el",
    },
  });
  const affiliate = await prisma.affiliate.create({
    data: {
      userId: user.id,
      status: "PENDING",
      fullName: "Action Check",
      email,
      phone: `+3065${String(stamp).slice(-8)}`,
      dateOfBirth: new Date("1993-03-03"),
      confirmedAdult: true,
      acceptedTermsAt: new Date(),
      acceptedPrivacyAt: new Date(),
    },
  });

  console.log("Administrator session");
  const asAdmin = await callAction(approveId, cookie);
  check("action route accepts the request", asAdmin.status >= 200 && asAdmin.status < 400, asAdmin.status);
  check(
    "an authenticated administrator is not rejected as unauthorized",
    !asAdmin.body.includes("errors.unauthorized"),
    asAdmin.body.slice(0, 140),
  );
  check(
    "missing fields are rejected by validation rather than proceeding",
    asAdmin.body.includes("errors.validation"),
    asAdmin.body.slice(0, 160),
  );
  check(
    "nothing was approved from an invalid payload",
    (await prisma.affiliate.findUniqueOrThrow({ where: { id: affiliate.id } })).status ===
      "PENDING",
  );

  console.log("\nNo session");
  const noSession = await callAction(approveId, "");
  check(
    "the same action is refused without a session",
    noSession.body.includes("errors.unauthorized") ||
      noSession.status === 307 ||
      noSession.status === 401,
    `${noSession.status} ${noSession.body.slice(0, 140)}`,
  );

  console.log("\nAffiliate session");
  const affiliateSessionToken = randomBytes(32).toString("base64url");
  const affiliateTokenHash = createHash("sha256")
    .update(affiliateSessionToken)
    .digest("hex");
  await prisma.session.create({
    data: {
      tokenHash: affiliateTokenHash,
      userId: user.id,
      expiresAt: new Date(Date.now() + 3_600_000),
    },
  });
  const asAffiliate = await callAction(approveId, `nds_session=${affiliateSessionToken}`);
  check(
    "an affiliate cannot reach an administrator action",
    asAffiliate.body.includes("errors.forbidden") ||
      asAffiliate.status === 307 ||
      asAffiliate.status === 403,
    `${asAffiliate.status} ${asAffiliate.body.slice(0, 140)}`,
  );

  console.log("\nCross-site request");
  const foreignOrigin = await fetch(`${BASE}/admin/applications`, {
    method: "POST",
    redirect: "manual",
    headers: { cookie, "Next-Action": approveId, origin: "https://attacker.example" },
    body: (() => {
      const b = new FormData();
      b.append("0", JSON.stringify(["$K1"]));
      return b;
    })(),
  });
  check(
    "an action posted from a foreign origin is refused",
    foreignOrigin.status >= 400 || foreignOrigin.status === 303,
    foreignOrigin.status,
  );

  // Cleanup limited to the records this run created.
  await prisma.auditLog.deleteMany({ where: { entityId: affiliate.id } });
  await prisma.auditLog.deleteMany({ where: { actorUserId: user.id } });
  await prisma.referralCode.deleteMany({ where: { affiliateId: affiliate.id } });
  await prisma.user.delete({ where: { id: user.id } });
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
