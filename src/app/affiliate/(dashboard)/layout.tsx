import {
  BookOpen,
  Coins,
  LayoutDashboard,
  ListChecks,
  ShoppingBag,
  Ticket,
  User as UserIcon,
  Wallet,
} from "lucide-react";

import { AppShell, type NavItem } from "@/components/layout/app-shell";
import { requireActiveAffiliatePage } from "@/lib/auth/guards";
import { getI18n } from "@/lib/i18n/server";
import {
  countUnread,
  listNotifications,
  renderNotification,
} from "@/lib/services/notifications";

export default async function AffiliateDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforced in the layout rather than each page so an unapproved affiliate is
  // redirected with a real 307 before any dashboard markup is streamed.
  const user = await requireActiveAffiliatePage();
  const { t } = await getI18n();

  const [rawNotifications, unreadCount] = await Promise.all([
    listNotifications(user.id, 12),
    countUnread(user.id),
  ]);
  const notifications = rawNotifications.map((entry) => renderNotification(entry, t));

  const primary: NavItem[] = [
    {
      href: "/affiliate/dashboard",
      labelKey: "affiliate.nav.dashboard",
      icon: <LayoutDashboard />,
    },
    { href: "/affiliate/referral", labelKey: "affiliate.nav.referral", icon: <Ticket /> },
  ];

  const business: NavItem[] = [
    { href: "/affiliate/leads", labelKey: "affiliate.nav.leads", icon: <ListChecks /> },
    { href: "/affiliate/sales", labelKey: "affiliate.nav.sales", icon: <ShoppingBag /> },
    { href: "/affiliate/commissions", labelKey: "affiliate.nav.commissions", icon: <Coins /> },
    { href: "/affiliate/payouts", labelKey: "affiliate.nav.payouts", icon: <Wallet /> },
  ];

  const account: NavItem[] = [
    { href: "/affiliate/resources", labelKey: "affiliate.nav.resources", icon: <BookOpen /> },
    {
      href: "/affiliate/notifications",
      labelKey: "affiliate.nav.notifications",
      icon: <ListChecks />,
      badge: unreadCount,
    },
    { href: "/affiliate/profile", labelKey: "affiliate.nav.profile", icon: <UserIcon /> },
  ];

  return (
    <AppShell
      nav={[
        { items: primary },
        { groupKey: "affiliate.nav.leads", items: business },
        { groupKey: "common.settings", items: account },
      ]}
      bottomNav={[
        {
          href: "/affiliate/dashboard",
          labelKey: "affiliate.nav.dashboard",
          icon: <LayoutDashboard />,
        },
        { href: "/affiliate/leads", labelKey: "affiliate.nav.leads", icon: <ListChecks /> },
        { href: "/affiliate/sales", labelKey: "affiliate.nav.sales", icon: <ShoppingBag /> },
        { href: "/affiliate/payouts", labelKey: "affiliate.nav.earnings", icon: <Wallet /> },
        { href: "/affiliate/profile", labelKey: "affiliate.nav.profile", icon: <UserIcon /> },
      ]}
      user={{ name: user.name, email: user.email }}
      profileHref="/affiliate/profile"
      homeHref="/affiliate/dashboard"
      notifications={notifications}
      unreadCount={unreadCount}
      notificationsHref="/affiliate/notifications"
    >
      {children}
    </AppShell>
  );
}
