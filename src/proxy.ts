import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/auth/session";

/**
 * Edge-level hardening and an optimistic auth redirect.
 *
 * This is deliberately not the authorization layer: it only checks whether a
 * session cookie is present so signed-out visitors are not served a dashboard
 * shell. Real role checks happen in `src/lib/auth/guards.ts` on every page,
 * server action and route handler.
 */
const PROTECTED_PREFIXES = ["/admin", "/affiliate/dashboard", "/affiliate/leads", "/affiliate/sales", "/affiliate/commissions", "/affiliate/payouts", "/affiliate/resources", "/affiliate/notifications", "/affiliate/profile", "/affiliate/referral", "/affiliate/status"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const needsSession = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (needsSession && !request.cookies.get(SESSION_COOKIE)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );
  response.headers.set("X-DNS-Prefetch-Control", "off");
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except Next internals and static assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|txt|xml|webmanifest)$).*)",
  ],
};
