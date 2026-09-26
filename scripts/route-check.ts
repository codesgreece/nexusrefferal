/**
 * Requests every route as an administrator and as an approved affiliate, and
 * asserts each one renders without an error boundary. Complements the
 * end-to-end flow script, which covers behaviour rather than coverage.
 *
 * Usage: npx tsx --conditions=react-server scripts/route-check.ts
 */
import { createHash, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const BASE = process.env.E2E_BASE_URL ?? "http://127.0.0.1:43711";
const prisma = new PrismaClient();

const ADMIN_ROUTES = [
  "/admin",
  "/admin/applications",
  "/admin/affiliates",
  "/admin/leads",
  "/admin/customers",
  "/admin/sales",
  "/admin/commissions",
  "/admin/payouts",
  "/admin/tracking",
  "/admin/services",
  "/admin/resources",
  "/admin/notifications",
  "/admin/audit",
  "/admin/settings",
  // Filtered and paginated variants exercise the search-param parsing.
  "/admin/leads?status=NEW&page=1",
  "/admin/commissions?status=PENDING",
  "/admin/sales?paymentStatus=PAID&from=2026-01-01&to=2026-12-31",
  "/admin/affiliates?q=maria&status=ACTIVE",
  "/admin/audit?action=LOGIN_SUCCEEDED",
  "/admin/leads?page=999",
];

const AFFILIATE_ROUTES = [
  "/affiliate/dashboard",
  "/affiliate/referral",
  "/affiliate/leads",
  "/affiliate/sales",
  "/affiliate/commissions",
  "/affiliate/payouts",
  "/affiliate/resources",
  "/affiliate/notifications",
  "/affiliate/profile",
  "/affiliate/leads?status=WON",
  "/affiliate/commissions?status=PAID",
];

const PUBLIC_ROUTES = [
  "/",
  "/contact",
  "/contact?service=professional-website",
  "/terms",
  "/privacy",
  "/login",
  "/affiliate/register",
  "/forgot-password",
  "/reset-password",
  "/reset-password?token=invalid",
  "/definitely-not-a-page",
];

let passed = 0;
let failed = 0;

function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) {
    passed += 1;
  } else {
    failed += 1;
    console.error(`  ✘ ${label}`, detail ?? "");
  }
}

async function makeSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  await prisma.session.create({
    data: {
      tokenHash: createHash("sha256").update(token).digest("hex"),
      userId,
      expiresAt: new Date(Date.now() + 3_600_000),
    },
  });
  return `nds_session=${token}`;
}

async function visit(path: string, cookie?: string, expected = 200) {
  const response = await fetch(`${BASE}${path}`, {
    headers: cookie ? { cookie } : undefined,
    redirect: "manual",
  });
  const body = response.status === expected ? await response.text() : "";
  const isErrorBoundary =
    body.includes("Something went wrong") || body.includes("Κάτι πήγε λάθος");
  check(
    `${path} → ${expected}`,
    response.status === expected && !isErrorBoundary,
    `got ${response.status}${isErrorBoundary ? " (error boundary rendered)" : ""}`,
  );
}

async function main() {
  console.log(`Route coverage against ${BASE}\n`);

  console.log("Public routes");
  for (const path of PUBLIC_ROUTES) {
    await visit(path, undefined, path === "/definitely-not-a-page" ? 404 : 200);
  }

  const admin = await prisma.user.findFirstOrThrow({ where: { role: "ADMIN" } });
  const adminCookie = await makeSession(admin.id);

  console.log("Admin routes");
  for (const path of ADMIN_ROUTES) {
    await visit(path, adminCookie);
  }

  // A throwaway approved affiliate so the affiliate routes render with a
  // real session rather than being skipped.
  const stamp = Date.now();
  const email = `routecheck.${stamp}@example.com`;
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash("route-check-password", 10),
      role: "AFFILIATE",
      name: "Route Check",
      locale: "el",
    },
  });
  const affiliate = await prisma.affiliate.create({
    data: {
      userId: user.id,
      status: "ACTIVE",
      fullName: "Route Check",
      email,
      phone: `+3066${String(stamp).slice(-8)}`,
      dateOfBirth: new Date("1994-02-02"),
      confirmedAdult: true,
      acceptedTermsAt: new Date(),
      acceptedPrivacyAt: new Date(),
      approvedAt: new Date(),
      approvedById: admin.id,
      referralCodes: {
        create: { code: `ROUTE${String(stamp).slice(-4)}`, isPrimary: true, isActive: true },
      },
    },
  });
  const affiliateCookie = await makeSession(user.id);

  console.log("Affiliate routes");
  for (const path of AFFILIATE_ROUTES) {
    await visit(path, affiliateCookie);
  }

  console.log("Cross-role authorization");
  for (const path of ADMIN_ROUTES.slice(0, 8)) {
    const response = await fetch(`${BASE}${path}`, {
      headers: { cookie: affiliateCookie },
      redirect: "manual",
    });
    const location = response.headers.get("location") ?? "";
    check(
      `affiliate blocked from ${path}`,
      response.status === 307 && location.includes("/affiliate"),
      `${response.status} ${location}`,
    );
  }
  for (const path of AFFILIATE_ROUTES.slice(0, 5)) {
    const response = await fetch(`${BASE}${path}`, {
      headers: { cookie: adminCookie },
      redirect: "manual",
    });
    const location = response.headers.get("location") ?? "";
    check(
      `admin redirected away from ${path}`,
      response.status === 307 && location.includes("/admin"),
      `${response.status} ${location}`,
    );
  }

  console.log("Security headers");
  const headerProbe = await fetch(`${BASE}/`, { redirect: "manual" });
  for (const [header, expected] of [
    ["x-content-type-options", "nosniff"],
    ["x-frame-options", "DENY"],
    ["referrer-policy", "strict-origin-when-cross-origin"],
  ] as const) {
    check(
      `${header} is set`,
      headerProbe.headers.get(header) === expected,
      headerProbe.headers.get(header),
    );
  }

  console.log("Both locales render every page");
  for (const path of ["/", "/contact", "/terms", "/privacy"]) {
    for (const locale of ["el", "en"]) {
      const response = await fetch(`${BASE}${path}`, {
        headers: { cookie: `nds_locale=${locale}` },
      });
      check(`${path} (${locale})`, response.status === 200, response.status);
    }
  }
  for (const path of ADMIN_ROUTES.slice(0, 14)) {
    const response = await fetch(`${BASE}${path}`, {
      headers: { cookie: `${adminCookie}; nds_locale=en` },
      redirect: "manual",
    });
    check(`${path} (en)`, response.status === 200, response.status);
  }

  await prisma.$transaction([
    prisma.referralCode.deleteMany({ where: { affiliateId: affiliate.id } }),
    prisma.user.delete({ where: { id: user.id } }),
    prisma.session.deleteMany({ where: { userId: admin.id } }),
  ]);

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
