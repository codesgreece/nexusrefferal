import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { REFERRAL_COOKIE, VISITOR_COOKIE, recordClick } from "@/lib/services/referral";
import { getSettings } from "@/lib/services/settings";
import { consume } from "@/lib/rate-limit";

/**
 * Referral link entry point: /ref/MARIA
 *
 * Records the visit, sets the attribution cookie and forwards the visitor to
 * the contact form with the code pre-filled. Unknown codes are not an error
 * for the visitor — they simply land on the public site with no attribution.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;
  const settings = await getSettings();
  const url = new URL(request.url);

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip");

  // Stable-but-anonymous visitor id so repeat clicks can be distinguished.
  let visitorId = request.cookies.get(VISITOR_COOKIE)?.value;
  const isNewVisitor = !visitorId;
  if (!visitorId) visitorId = randomBytes(12).toString("base64url");

  // Cheap abuse guard: a single visitor cannot inflate click counts endlessly.
  const allowed = consume(`ref-click:${visitorId}:${code}`, 10, 60 * 60 * 1000);

  const resolved = allowed
    ? await recordClick({
        code,
        landingPath: url.pathname,
        source: url.searchParams.get("utm_source") ?? url.searchParams.get("source"),
        campaign: url.searchParams.get("utm_campaign") ?? url.searchParams.get("campaign"),
        medium: url.searchParams.get("utm_medium"),
        referer: request.headers.get("referer"),
        userAgent: request.headers.get("user-agent"),
        ip,
        visitorId,
      })
    : null;

  const destination = new URL(resolved ? "/contact" : "/", url.origin);
  if (resolved) destination.searchParams.set("ref", resolved.code);
  const service = url.searchParams.get("service");
  if (service) destination.searchParams.set("service", service);

  const response = NextResponse.redirect(destination, { status: 307 });

  if (isNewVisitor) {
    response.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  if (resolved) {
    response.cookies.set(REFERRAL_COOKIE, resolved.code, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: settings.referralCookieDays * 24 * 60 * 60,
    });
  }

  return response;
}
