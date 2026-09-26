import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getCurrentUser } from "@/lib/auth/session";
import { getSettings } from "@/lib/services/settings";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);

  return (
    <div className="flex min-h-dvh flex-col bg-void">
      <SiteHeader
        isAuthenticated={Boolean(user)}
        dashboardHref={user?.role === "ADMIN" ? "/admin" : "/affiliate/dashboard"}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter
        contactEmail={settings.contactEmail}
        termsUrl={settings.termsUrl}
        privacyUrl={settings.privacyUrl}
      />
    </div>
  );
}
