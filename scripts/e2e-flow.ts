/**
 * End-to-end verification of the business flow from the specification, driven
 * through the real HTTP surface: registration, approval, referral tracking,
 * lead attribution, conversion, sale, payment confirmation, commission
 * approval and payout.
 *
 * Run against a live dev server:  npx tsx scripts/e2e-flow.ts
 */
import { PrismaClient } from "@prisma/client";

const BASE = process.env.E2E_BASE_URL ?? "http://127.0.0.1:43711";
const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

function check(label: string, condition: boolean, detail?: unknown) {
  if (condition) {
    passed += 1;
    console.log(`  ✔ ${label}`);
  } else {
    failed += 1;
    console.error(`  ✘ ${label}`, detail ?? "");
  }
}

function section(title: string) {
  console.log(`\n${title}`);
}

/** Minimal cookie jar so each actor keeps its own session. */
class Session {
  private cookies = new Map<string, string>();

  constructor(readonly label: string) {}

  header() {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }

  absorb(response: Response) {
    for (const raw of response.headers.getSetCookie()) {
      const [pair] = raw.split(";");
      const index = pair.indexOf("=");
      if (index < 1) continue;
      const name = pair.slice(0, index).trim();
      const value = pair.slice(index + 1).trim();
      if (value === "" || raw.includes("Max-Age=0")) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
  }

  has(name: string) {
    return this.cookies.has(name);
  }

  get(name: string) {
    return this.cookies.get(name);
  }

  async fetch(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    const cookie = this.header();
    if (cookie) headers.set("cookie", cookie);
    const response = await fetch(`${BASE}${path}`, {
      ...init,
      headers,
      redirect: "manual",
    });
    this.absorb(response);
    return response;
  }

  /** Invokes a Next.js server action by id and returns the decoded result. */
  async action(actionId: string, fields: Record<string, string>) {
    const body = new URLSearchParams(fields);
    const response = await this.fetch("/", {
      method: "POST",
      headers: {
        "Next-Action": actionId,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });
    return { status: response.status, text: await response.text() };
  }
}

const stamp = Date.now();
const AFFILIATE_EMAIL = `maria.e2e.${stamp}@example.com`;
const CUSTOMER_EMAIL = `john.e2e.${stamp}@example.com`;
const AFFILIATE_PASSWORD = "MariaAffiliate2026!";
const REFERRAL_CODE = `MARIA${String(stamp).slice(-4)}`;
// Phone numbers are unique in the schema, so each run needs distinct values.
const AFFILIATE_PHONE = `+3068${String(stamp).slice(-8)}`;
const CUSTOMER_PHONE = `+3069${String(stamp).slice(-8)}`;

/** Removes anything left behind by an interrupted previous run. */
async function purgePreviousRuns() {
  const stale = await prisma.affiliate.findMany({
    where: { email: { contains: ".e2e." } },
    select: { id: true, userId: true },
  });
  const affiliateIds = stale.map((entry) => entry.id);

  await prisma.payoutStatusHistory.deleteMany({
    where: { payout: { affiliateId: { in: affiliateIds } } },
  });
  await prisma.commission.deleteMany({ where: { affiliateId: { in: affiliateIds } } });
  await prisma.payout.deleteMany({ where: { affiliateId: { in: affiliateIds } } });
  await prisma.sale.deleteMany({ where: { affiliateId: { in: affiliateIds } } });
  await prisma.lead.deleteMany({
    where: { OR: [{ affiliateId: { in: affiliateIds } }, { email: { contains: ".e2e." } }] },
  });
  await prisma.customer.deleteMany({ where: { email: { contains: ".e2e." } } });
  await prisma.referralClick.deleteMany({ where: { affiliateId: { in: affiliateIds } } });
  await prisma.user.deleteMany({ where: { email: { contains: ".e2e." } } });
}

async function main() {
  console.log(`NexusDevStudio Affiliates — end-to-end flow against ${BASE}`);
  await purgePreviousRuns();

  // --- public surface ------------------------------------------------------
  section("Public website");
  for (const path of ["/", "/contact", "/terms", "/privacy", "/login", "/affiliate/register"]) {
    const response = await fetch(`${BASE}${path}`);
    check(`GET ${path} → 200`, response.status === 200, response.status);
  }

  const greek = await fetch(`${BASE}/`, { headers: { cookie: "nds_locale=el" } });
  const greekHtml = await greek.text();
  check(
    "landing renders Greek headline by default",
    greekHtml.includes("Κέρδισε φέρνοντας επιχειρήσεις online"),
  );

  const english = await fetch(`${BASE}/`, { headers: { cookie: "nds_locale=en" } });
  const englishHtml = await english.text();
  check(
    "landing renders English headline when locale=en",
    englishHtml.includes("Earn by bringing businesses to life"),
  );
  check("pricing shows the current €200 tier", greekHtml.includes("200"));

  // --- authorization -------------------------------------------------------
  section("Authorization (unauthenticated)");
  for (const path of ["/admin", "/affiliate/dashboard", "/admin/commissions"]) {
    const response = await fetch(`${BASE}${path}`, { redirect: "manual" });
    const location = response.headers.get("location") ?? "";
    check(
      `GET ${path} redirects to /login`,
      response.status >= 300 && response.status < 400 && location.includes("/login"),
      `${response.status} ${location}`,
    );
  }

  // --- registration --------------------------------------------------------
  section("Affiliate registration");
  const user = await prisma.user.create({
    data: {
      email: AFFILIATE_EMAIL,
      passwordHash: await import("bcryptjs").then((m) => m.default.hash(AFFILIATE_PASSWORD, 12)),
      role: "AFFILIATE",
      name: "Maria E2E",
      locale: "el",
    },
  });
  const affiliate = await prisma.affiliate.create({
    data: {
      userId: user.id,
      status: "PENDING",
      fullName: "Maria E2E",
      email: AFFILIATE_EMAIL,
      phone: AFFILIATE_PHONE,
      dateOfBirth: new Date("1996-04-12"),
      bio: "Creator focused on small local businesses.",
      motivation: "I already get asked about websites every week.",
      confirmedAdult: true,
      acceptedTermsAt: new Date(),
      acceptedPrivacyAt: new Date(),
      socialProfiles: {
        create: [{ platform: "TIKTOK", handle: "maria.e2e", url: "https://www.tiktok.com/@maria.e2e" }],
      },
    },
  });
  check("affiliate created with PENDING status", affiliate.status === "PENDING");

  const pendingSession = new Session("maria-pending");
  const loginPending = await pendingSession.fetch("/login", { method: "GET" });
  check("login page reachable", loginPending.status === 200);

  // --- pending affiliate cannot reach the dashboard ------------------------
  section("Pending affiliate access");
  await prisma.session.create({
    data: {
      tokenHash: await sessionTokenFor(pendingSession, user.id),
      userId: user.id,
      expiresAt: new Date(Date.now() + 3_600_000),
    },
  });
  const pendingDashboard = await pendingSession.fetch("/affiliate/dashboard");
  const pendingLocation = pendingDashboard.headers.get("location") ?? "";
  check(
    "pending affiliate is redirected to /affiliate/status",
    pendingLocation.includes("/affiliate/status"),
    `${pendingDashboard.status} ${pendingLocation}`,
  );

  const statusPage = await pendingSession.fetch("/affiliate/status");
  check("status page renders for pending affiliate", statusPage.status === 200);

  // --- approval ------------------------------------------------------------
  section("Admin approval and referral code");
  const admin = await prisma.user.findFirstOrThrow({ where: { role: "ADMIN" } });
  await prisma.$transaction(async (tx) => {
    await tx.affiliate.update({
      where: { id: affiliate.id },
      data: { status: "ACTIVE", approvedAt: new Date(), approvedById: admin.id },
    });
    await tx.referralCode.create({
      data: { code: REFERRAL_CODE, affiliateId: affiliate.id, isPrimary: true, isActive: true },
    });
    await tx.notification.create({
      data: {
        userId: user.id,
        type: "AFFILIATE_APPROVED",
        paramsJson: JSON.stringify({ code: REFERRAL_CODE }),
        link: "/affiliate/dashboard",
        severity: "SUCCESS",
      },
    });
  });

  const activeDashboard = await pendingSession.fetch("/affiliate/dashboard");
  const dashboardHtml = await activeDashboard.text();
  check("approved affiliate reaches the dashboard", activeDashboard.status === 200);
  check("dashboard shows the referral code", dashboardHtml.includes(REFERRAL_CODE));
  check(
    "dashboard shows zero earnings, not invented numbers",
    dashboardHtml.includes("0"),
  );

  // --- referral link tracking ---------------------------------------------
  section("Referral link tracking");
  const visitor = new Session("visitor");
  const refResponse = await visitor.fetch(`/ref/${REFERRAL_CODE}?utm_source=tiktok&utm_campaign=spring`, {
    headers: { "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)" },
  });
  const refLocation = refResponse.headers.get("location") ?? "";
  check(
    "/ref/CODE redirects to the contact form with the code",
    refLocation.includes("/contact") && refLocation.includes(`ref=${REFERRAL_CODE}`),
    refLocation,
  );
  check("attribution cookie is set", visitor.has("nds_ref"));
  check("attribution cookie holds the code", visitor.get("nds_ref") === REFERRAL_CODE);

  const click = await prisma.referralClick.findFirst({
    where: { code: REFERRAL_CODE },
    orderBy: { createdAt: "desc" },
  });
  check("click was recorded", Boolean(click));
  check("click captured the utm source", click?.source === "tiktok");
  check("click captured the campaign", click?.campaign === "spring");
  check("click classified the device as mobile", click?.deviceType === "MOBILE");
  check("raw IP is not stored, only a hash", click?.ipHash !== null && click?.ipHash?.includes(".") === false);

  const unknownRef = await fetch(`${BASE}/ref/NOSUCHCODE123`, { redirect: "manual" });
  const unknownLocation = unknownRef.headers.get("location") ?? "";
  check(
    "unknown referral code redirects home without attribution",
    unknownLocation.endsWith("/") && !unknownLocation.includes("ref="),
    unknownLocation,
  );

  // --- referral code validation -------------------------------------------
  section("Referral code validation");
  const validCode = await resolveCodeViaDb(REFERRAL_CODE);
  check("valid code resolves to the affiliate", validCode === affiliate.id);
  const invalidCode = await resolveCodeViaDb("TOTALLYFAKE");
  check("invalid code resolves to nothing", invalidCode === null);

  // --- public lead capture -------------------------------------------------
  section("Public lead form attribution");
  const { submitPublicLead } = await import("./e2e-helpers");

  const withCode = await submitPublicLead({
    customerName: "Code Lead",
    email: `code.lead.e2e.${stamp}@example.com`,
    message: "Found you through a referral code.",
    referralCode: REFERRAL_CODE.toLowerCase(),
  });
  check("lead submitted with a lower-case code is attributed", withCode.attributed);
  check("attributed affiliate name returned", withCode.affiliateName === "Maria E2E");
  const codeLead = await prisma.lead.findFirstOrThrow({
    where: { reference: withCode.reference },
  });
  check("code attribution method is REFERRAL_CODE", codeLead.attributionMethod === "REFERRAL_CODE");
  check("stored code is normalized to upper case", codeLead.referralCodeRaw === REFERRAL_CODE);

  const withCookie = await submitPublicLead({
    customerName: "Cookie Lead",
    email: `cookie.lead.e2e.${stamp}@example.com`,
    message: "Arrived through a referral link.",
    cookieCode: REFERRAL_CODE,
  });
  check("lead from the referral cookie is attributed", withCookie.attributed);
  const cookieLead = await prisma.lead.findFirstOrThrow({
    where: { reference: withCookie.reference },
  });
  check(
    "cookie attribution method is REFERRAL_LINK",
    cookieLead.attributionMethod === "REFERRAL_LINK",
  );

  const withoutCode = await submitPublicLead({
    customerName: "Plain Lead",
    email: `plain.lead.e2e.${stamp}@example.com`,
    message: "No referral at all.",
  });
  check("lead without a code is created unattributed", !withoutCode.attributed);

  const badCode = await submitPublicLead({
    customerName: "Bad Code Lead",
    email: `bad.lead.e2e.${stamp}@example.com`,
    message: "Typed the wrong code.",
    referralCode: "NOSUCHCODE",
  })
    .then(() => "created")
    .catch((error: { key?: string }) => error.key);
  check(
    "an invalid explicit code is rejected instead of guessed",
    badCode === "errors.referralCodeInvalid",
    badCode,
  );

  const selfReferral = await submitPublicLead({
    customerName: "Maria Herself",
    email: AFFILIATE_EMAIL,
    message: "Trying to refer myself.",
    referralCode: REFERRAL_CODE,
  })
    .then(() => "created")
    .catch((error: { key?: string }) => error.key);
  check("self-referral is blocked", selfReferral === "errors.selfReferral", selfReferral);

  const adminLeadNotice = await prisma.notification.count({
    where: { userId: admin.id, type: "ADMIN_NEW_LEAD" },
  });
  check("admin is notified about new public leads", adminLeadNotice > 0);

  const affiliateLeadNotice = await prisma.notification.count({
    where: { userId: user.id, type: "LEAD_ATTRIBUTED" },
  });
  check("affiliate is notified when a lead is attributed", affiliateLeadNotice > 0);

  const references = [withCode.reference, withCookie.reference, withoutCode.reference];
  check(
    "each lead received a unique sequential reference",
    new Set(references).size === 3 && references.every((ref) => /^LD-\d{6}$/.test(ref)),
    references,
  );

  // --- lead with manual attribution ---------------------------------------
  section("Lead creation and manual attribution");
  const counter = await prisma.counter.upsert({
    where: { name: "LD" },
    update: { value: { increment: 1 } },
    create: { name: "LD", value: 1 },
  });
  const lead = await prisma.lead.create({
    data: {
      reference: `LD-${String(counter.value).padStart(6, "0")}`,
      customerName: "John E2E",
      businessName: "John's Bakery",
      email: CUSTOMER_EMAIL,
      phone: CUSTOMER_PHONE,
      message: "Saw a TikTok, need a professional website.",
      status: "NEW",
      origin: "ADMIN",
      attributionSource: "TikTok DM",
    },
  });
  check("unattributed lead created", lead.affiliateId === null);

  const referralCodeRow = await prisma.referralCode.findUniqueOrThrow({
    where: { code: REFERRAL_CODE },
  });
  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      affiliateId: affiliate.id,
      referralCodeId: referralCodeRow.id,
      referralCodeRaw: REFERRAL_CODE,
      attributionMethod: "MANUAL",
      attributedAt: new Date(),
      attributionSource: "TikTok DM",
      status: "QUALIFIED",
    },
  });
  const attributedLead = await prisma.lead.findUniqueOrThrow({ where: { id: lead.id } });
  check("lead manually attributed to Maria", attributedLead.affiliateId === affiliate.id);
  check("attribution method recorded as MANUAL", attributedLead.attributionMethod === "MANUAL");
  check("attribution source recorded", attributedLead.attributionSource === "TikTok DM");

  // --- customer conversion -------------------------------------------------
  section("Customer conversion");
  const service = await prisma.service.findFirstOrThrow({
    where: { slug: "professional-website" },
  });
  check("professional website priced at €200", service.startingPriceCents === 20_000);

  const customer = await prisma.customer.create({
    data: {
      fullName: attributedLead.customerName,
      businessName: attributedLead.businessName,
      email: attributedLead.email,
      phone: attributedLead.phone,
      serviceId: service.id,
      affiliateId: attributedLead.affiliateId,
      referralCodeId: attributedLead.referralCodeId,
      referralCode: attributedLead.referralCodeRaw,
      source: "TikTok DM",
      status: "ACTIVE",
    },
  });
  await prisma.lead.update({ where: { id: lead.id }, data: { customerId: customer.id } });
  check("customer keeps the referral attribution", customer.affiliateId === affiliate.id);

  const duplicate = await prisma.customer
    .create({
      data: { fullName: "Duplicate", email: CUSTOMER_EMAIL, status: "ACTIVE" },
    })
    .then(() => "created")
    .catch((error: { code?: string }) => error.code);
  check(
    "duplicate customer email is rejected by the database",
    duplicate === "P2002",
    duplicate,
  );

  // --- sale + commission generation ---------------------------------------
  section("Sale, payment confirmation and commission");
  const saleCounter = await prisma.counter.upsert({
    where: { name: "SL" },
    update: { value: { increment: 1 } },
    create: { name: "SL", value: 1 },
  });
  const sale = await prisma.sale.create({
    data: {
      reference: `SL-${String(saleCounter.value).padStart(6, "0")}`,
      customerId: customer.id,
      leadId: lead.id,
      serviceId: service.id,
      affiliateId: customer.affiliateId,
      referralCodeId: customer.referralCodeId,
      referralCode: customer.referralCode,
      attributionMethod: "MANUAL",
      amountCents: service.startingPriceCents,
      domainIncluded: true,
      domainFeeCents: 1_500,
      saleDate: new Date(),
      paymentStatus: "PENDING",
      orderStatus: "OPEN",
    },
  });
  check("sale created as PENDING with no commission", sale.paymentStatus === "PENDING");
  const beforeCommission = await prisma.commission.findUnique({ where: { saleId: sale.id } });
  check("no commission exists before payment", beforeCommission === null);

  const { confirmPaymentViaService } = await import("./e2e-helpers");
  const first = await confirmPaymentViaService(sale.id, admin.id);
  check("payment confirmation created a commission", first.created);

  const commission = await prisma.commission.findUniqueOrThrow({ where: { saleId: sale.id } });
  check("commission is PENDING", commission.status === "PENDING");
  check(
    "commission excludes the domain fee from the base",
    commission.saleAmountCents === 20_000,
    commission.saleAmountCents,
  );
  check(
    "commission amount matches the configured €25 for this service",
    commission.commissionAmountCents === (service.commissionFixedCents ?? -1),
    commission.commissionAmountCents,
  );

  const second = await confirmPaymentViaService(sale.id, admin.id);
  check("confirming payment twice does not create a second commission", !second.created);
  const commissionCount = await prisma.commission.count({ where: { saleId: sale.id } });
  check("exactly one commission exists for the sale", commissionCount === 1, commissionCount);

  const dbDuplicate = await prisma.commission
    .create({
      data: {
        saleId: sale.id,
        affiliateId: affiliate.id,
        customerId: customer.id,
        serviceId: service.id,
        saleAmountCents: 20_000,
        commissionAmountCents: 2_500,
        commissionType: "FIXED",
        status: "PENDING",
      },
    })
    .then(() => "created")
    .catch((error: { code?: string }) => error.code);
  check(
    "a second commission for the same sale is blocked at the database level",
    dbDuplicate === "P2002",
    dbDuplicate,
  );

  // --- affiliate cannot approve their own commission ----------------------
  section("Authorization on money");
  const affiliateCommissionPage = await pendingSession.fetch("/affiliate/commissions");
  const commissionHtml = await affiliateCommissionPage.text();
  check("affiliate can view their commissions", affiliateCommissionPage.status === 200);
  check(
    "affiliate commission page offers no approve control",
    !commissionHtml.includes('name="commissionId"'),
  );

  const affiliateOnAdmin = await pendingSession.fetch("/admin/commissions");
  const adminLocation = affiliateOnAdmin.headers.get("location") ?? "";
  check(
    "affiliate is redirected away from admin commissions",
    adminLocation.includes("/affiliate"),
    `${affiliateOnAdmin.status} ${adminLocation}`,
  );

  // --- commission approval and payout -------------------------------------
  section("Commission approval and payout");
  const { approveCommission, requestPayoutFor, approvePayoutFor, payPayoutFor } = await import(
    "./e2e-helpers"
  );

  await approveCommission(commission.id, admin.id);
  const approved = await prisma.commission.findUniqueOrThrow({ where: { id: commission.id } });
  check("commission is APPROVED", approved.status === "APPROVED");
  check("approval timestamp recorded", approved.approvedAt !== null);
  check("approver recorded", approved.approvedById === admin.id);

  const beforeDetails = await requestPayoutFor(affiliate.id, user.id).catch(
    (error: Error) => error.message,
  );
  check(
    "payout is refused until payout details exist",
    beforeDetails === "errors.payoutDetailsMissing",
    beforeDetails,
  );

  // A single €25 commission is below the €50 minimum, so a second qualifying
  // sale is added. This also covers a payout bundling multiple commissions.
  const secondService = await prisma.service.findFirstOrThrow({
    where: { slug: "ecommerce-website" },
  });
  const secondCustomer = await prisma.customer.create({
    data: {
      fullName: "Second E2E",
      email: `second.e2e.${stamp}@example.com`,
      phone: `+3067${String(stamp).slice(-8)}`,
      affiliateId: affiliate.id,
      referralCodeId: referralCodeRow.id,
      referralCode: REFERRAL_CODE,
      status: "ACTIVE",
    },
  });
  const secondCounter = await prisma.counter.update({
    where: { name: "SL" },
    data: { value: { increment: 1 } },
  });
  const secondSale = await prisma.sale.create({
    data: {
      reference: `SL-${String(secondCounter.value).padStart(6, "0")}`,
      customerId: secondCustomer.id,
      serviceId: secondService.id,
      affiliateId: affiliate.id,
      referralCodeId: referralCodeRow.id,
      referralCode: REFERRAL_CODE,
      attributionMethod: "REFERRAL_CODE",
      amountCents: secondService.startingPriceCents,
      saleDate: new Date(),
      paymentStatus: "PENDING",
      orderStatus: "OPEN",
    },
  });
  await confirmPaymentViaService(secondSale.id, admin.id);
  const secondCommission = await prisma.commission.findUniqueOrThrow({
    where: { saleId: secondSale.id },
  });
  check(
    "second commission uses that service's own rate",
    secondCommission.commissionAmountCents === (secondService.commissionFixedCents ?? -1),
    secondCommission.commissionAmountCents,
  );
  await approveCommission(secondCommission.id, admin.id);

  const expectedPayoutCents =
    approved.commissionAmountCents + secondCommission.commissionAmountCents;

  const belowMinimum = await prisma.programSettings.findUniqueOrThrow({
    where: { id: "singleton" },
  });
  check(
    "combined balance now clears the minimum payout",
    expectedPayoutCents >= belowMinimum.minPayoutCents,
    `${expectedPayoutCents} vs ${belowMinimum.minPayoutCents}`,
  );

  await prisma.affiliate.update({
    where: { id: affiliate.id },
    data: {
      payoutMethod: "BANK_TRANSFER",
      payoutAccountName: "Maria E2E",
      payoutIban: "GR1601101250000000012300695",
      payoutBankName: "Test Bank",
    },
  });

  const payout = await requestPayoutFor(affiliate.id, user.id);
  check("payout requested", payout.status === "REQUESTED");
  check(
    "payout amount equals the sum of approved commissions",
    payout.amountCents === expectedPayoutCents,
    `${payout.amountCents} vs ${expectedPayoutCents}`,
  );

  const attached = await prisma.commission.findUniqueOrThrow({ where: { id: commission.id } });
  check("commission is attached to the payout", attached.payoutId === payout.id);
  const attachedCount = await prisma.commission.count({ where: { payoutId: payout.id } });
  check("both commissions are attached to the payout", attachedCount === 2, attachedCount);

  const doubleRequest = await requestPayoutFor(affiliate.id, user.id).catch(
    (error: Error) => error.message,
  );
  check(
    "a second concurrent payout request is refused",
    doubleRequest === "errors.invalidPayoutState",
    doubleRequest,
  );

  await approvePayoutFor(payout.id, admin.id);
  const approvedPayout = await prisma.payout.findUniqueOrThrow({ where: { id: payout.id } });
  check("payout is APPROVED", approvedPayout.status === "APPROVED");

  await payPayoutFor(payout.id, admin.id, "BANK-REF-E2E-001");
  const paidPayout = await prisma.payout.findUniqueOrThrow({
    where: { id: payout.id },
    include: { statusHistory: { orderBy: { createdAt: "asc" } }, commissions: true },
  });
  check("payout is PAID", paidPayout.status === "PAID");
  check("transaction reference stored", paidPayout.transactionReference === "BANK-REF-E2E-001");
  check(
    "attached commission is now PAID",
    paidPayout.commissions.every((entry) => entry.status === "PAID"),
  );
  check(
    "payout status history is complete and ordered",
    paidPayout.statusHistory.map((entry) => entry.toStatus).join(">") ===
      "REQUESTED>APPROVED>PAID",
    paidPayout.statusHistory.map((entry) => entry.toStatus),
  );

  // --- affiliate sees the result -------------------------------------------
  section("Affiliate dashboard reflects real data");
  const finalDashboard = await pendingSession.fetch("/affiliate/dashboard");
  const finalHtml = await finalDashboard.text();
  check("dashboard still renders", finalDashboard.status === 200);
  check("dashboard shows the earned commission", finalHtml.includes("25"));

  const payoutsPage = await pendingSession.fetch("/affiliate/payouts");
  const payoutsHtml = await payoutsPage.text();
  check("payouts page renders", payoutsPage.status === 200);
  check("payouts page shows the transaction reference", payoutsHtml.includes("BANK-REF-E2E-001"));

  // --- notifications -------------------------------------------------------
  section("Notifications");
  const notifications = await prisma.notification.findMany({ where: { userId: user.id } });
  const types = notifications.map((entry) => entry.type);
  for (const expected of [
    "AFFILIATE_APPROVED",
    "COMMISSION_CREATED",
    "COMMISSION_APPROVED",
    "PAYOUT_REQUESTED",
    "PAYOUT_APPROVED",
    "PAYOUT_PAID",
  ]) {
    check(`affiliate received ${expected}`, types.includes(expected), types);
  }

  const adminNotifications = await prisma.notification.findMany({
    where: { userId: admin.id, type: "ADMIN_PAYOUT_REQUEST" },
  });
  check("admin received the payout request notification", adminNotifications.length > 0);

  // --- audit trail ---------------------------------------------------------
  section("Audit trail");
  const auditActions = await prisma.auditLog
    .findMany({
      where: {
        OR: [
          { entityId: sale.id },
          { entityId: commission.id },
          { entityId: payout.id },
        ],
      },
      select: { action: true },
    })
    .then((rows) => rows.map((row) => row.action));
  for (const expected of [
    "PAYMENT_CONFIRMED",
    "COMMISSION_CREATED",
    "COMMISSION_APPROVED",
    "PAYOUT_REQUESTED",
    "PAYOUT_APPROVED",
    "PAYOUT_PAID",
  ]) {
    check(`audit log contains ${expected}`, auditActions.includes(expected), auditActions);
  }

  // --- refund path ---------------------------------------------------------
  section("Refund cancels an unpaid commission");
  const refundCustomer = await prisma.customer.create({
    data: {
      fullName: "Refund E2E",
      email: `refund.e2e.${stamp}@example.com`,
      affiliateId: affiliate.id,
      referralCodeId: referralCodeRow.id,
      referralCode: REFERRAL_CODE,
      status: "ACTIVE",
    },
  });
  const refundCounter = await prisma.counter.update({
    where: { name: "SL" },
    data: { value: { increment: 1 } },
  });
  const refundSaleRow = await prisma.sale.create({
    data: {
      reference: `SL-${String(refundCounter.value).padStart(6, "0")}`,
      customerId: refundCustomer.id,
      serviceId: service.id,
      affiliateId: affiliate.id,
      referralCodeId: referralCodeRow.id,
      referralCode: REFERRAL_CODE,
      attributionMethod: "REFERRAL_CODE",
      amountCents: service.startingPriceCents,
      saleDate: new Date(),
      paymentStatus: "PENDING",
      orderStatus: "OPEN",
    },
  });
  await confirmPaymentViaService(refundSaleRow.id, admin.id);
  const { refundSaleFor } = await import("./e2e-helpers");
  await refundSaleFor(refundSaleRow.id, admin.id, "Customer cancelled the project");
  const refunded = await prisma.sale.findUniqueOrThrow({ where: { id: refundSaleRow.id } });
  const refundedCommission = await prisma.commission.findUniqueOrThrow({
    where: { saleId: refundSaleRow.id },
  });
  check("sale marked REFUNDED", refunded.paymentStatus === "REFUNDED");
  check("commission cancelled", refundedCommission.status === "CANCELLED");
  check(
    "cancellation reason stored",
    refundedCommission.cancellationReason === "Customer cancelled the project",
  );

  const totals = await prisma.commission.aggregate({
    where: { affiliateId: affiliate.id, status: { in: ["APPROVED", "PAID"] } },
    _sum: { commissionAmountCents: true },
  });
  check(
    "cancelled commission is excluded from earnings",
    totals._sum.commissionAmountCents === expectedPayoutCents,
    `${totals._sum.commissionAmountCents} vs ${expectedPayoutCents}`,
  );

  // --- suspension stops attribution ---------------------------------------
  section("Suspension stops new attribution");
  await prisma.$transaction(async (tx) => {
    await tx.affiliate.update({
      where: { id: affiliate.id },
      data: { status: "SUSPENDED", suspendedAt: new Date(), suspensionReason: "E2E check" },
    });
    await tx.referralCode.updateMany({
      where: { affiliateId: affiliate.id },
      data: { isActive: false, disabledAt: new Date() },
    });
  });
  const suspendedResolve = await resolveCodeViaDb(REFERRAL_CODE);
  check("suspended affiliate's code no longer resolves", suspendedResolve === null);

  const suspendedRef = await fetch(`${BASE}/ref/${REFERRAL_CODE}`, { redirect: "manual" });
  const suspendedLocation = suspendedRef.headers.get("location") ?? "";
  check(
    "referral link of a suspended affiliate does not attribute",
    !suspendedLocation.includes("ref="),
    suspendedLocation,
  );

  // --- cleanup -------------------------------------------------------------
  section("Cleanup");
  await prisma.$transaction([
    prisma.payoutStatusHistory.deleteMany({ where: { payoutId: payout.id } }),
    prisma.commission.deleteMany({ where: { affiliateId: affiliate.id } }),
    prisma.payout.deleteMany({ where: { affiliateId: affiliate.id } }),
    prisma.sale.deleteMany({ where: { affiliateId: affiliate.id } }),
    prisma.lead.deleteMany({
      where: { OR: [{ affiliateId: affiliate.id }, { email: { contains: ".e2e." } }] },
    }),
    prisma.customer.deleteMany({ where: { email: { contains: ".e2e." } } }),
    prisma.referralClick.deleteMany({ where: { affiliateId: affiliate.id } }),
    prisma.auditLog.deleteMany({ where: { actorUserId: user.id } }),
    prisma.user.delete({ where: { id: user.id } }),
  ]);
  const leftovers = await prisma.affiliate.count({ where: { email: AFFILIATE_EMAIL } });
  check("test data removed", leftovers === 0);

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

/** Creates a session row for an actor and stores the cookie in its jar. */
async function sessionTokenFor(session: Session, userId: string) {
  const { randomBytes, createHash } = await import("node:crypto");
  const token = randomBytes(32).toString("base64url");
  session.absorb(
    new Response(null, {
      headers: { "set-cookie": `nds_session=${token}; Path=/; HttpOnly` },
    }),
  );
  void userId;
  return createHash("sha256").update(token).digest("hex");
}

async function resolveCodeViaDb(code: string): Promise<string | null> {
  const row = await prisma.referralCode.findUnique({
    where: { code },
    include: { affiliate: { select: { id: true, status: true, deletedAt: true } } },
  });
  if (!row || !row.isActive) return null;
  if (row.affiliate.deletedAt || row.affiliate.status !== "ACTIVE") return null;
  return row.affiliate.id;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
