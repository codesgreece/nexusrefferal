import {
  BookOpen,
  Coins,
  FileClock,
  LayoutDashboard,
  ListChecks,
  MousePointerClick,
  Package,
  Settings,
  ShoppingBag,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

import { AppShell, type NavItem } from "@/components/layout/app-shell";
import { requireAdminPage } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/i18n/server";
import {
  countUnread,
  listNotifications,
  renderNotification,
} from "@/lib/services/notifications";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage();
  const { t } = await getI18n();

  const [rawNotifications, unreadCount, pendingApplications, pendingPayouts, pendingCommissions] =
    await Promise.all([
      listNotifications(admin.id, 12),
      countUnread(admin.id),
      prisma.affiliate.count({ where: { status: "PENDING", deletedAt: null } }),
      prisma.payout.count({ where: { status: { in: ["REQUESTED", "APPROVED"] } } }),
      prisma.commission.count({ where: { status: "PENDING" } }),
    ]);

  const overview: NavItem[] = [
    { href: "/admin", labelKey: "admin.nav.dashboard", icon: <LayoutDashboard /> },
    {
      href: "/admin/applications",
      labelKey: "admin.nav.applications",
      icon: <UserPlus />,
      badge: pendingApplications,
    },
    {
      href: "/admin/affiliates",
      labelKey: "admin.nav.affiliates",
      icon: <Users />,
      matchPrefix: true,
    },
  ];

  const pipeline: NavItem[] = [
    { href: "/admin/leads", labelKey: "admin.nav.leads", icon: <ListChecks /> },
    { href: "/admin/customers", labelKey: "admin.nav.customers", icon: <Users /> },
    { href: "/admin/sales", labelKey: "admin.nav.sales", icon: <ShoppingBag /> },
  ];

  const money: NavItem[] = [
    {
      href: "/admin/commissions",
      labelKey: "admin.nav.commissions",
      icon: <Coins />,
      badge: pendingCommissions,
    },
    {
      href: "/admin/payouts",
      labelKey: "admin.nav.payouts",
      icon: <Wallet />,
      badge: pendingPayouts,
    },
  ];

  const config: NavItem[] = [
    { href: "/admin/tracking", labelKey: "admin.nav.tracking", icon: <MousePointerClick /> },
    { href: "/admin/services", labelKey: "admin.nav.services", icon: <Package /> },
    { href: "/admin/resources", labelKey: "admin.nav.resources", icon: <BookOpen /> },
    {
      href: "/admin/notifications",
      labelKey: "admin.nav.notifications",
      icon: <ListChecks />,
      badge: unreadCount,
    },
    { href: "/admin/audit", labelKey: "admin.nav.audit", icon: <FileClock /> },
    { href: "/admin/settings", labelKey: "admin.nav.settings", icon: <Settings /> },
  ];

  return (
    <AppShell
      nav={[
        { items: overview },
        { groupKey: "admin.nav.leads", items: pipeline },
        { groupKey: "admin.nav.commissions", items: money },
        { groupKey: "common.settings", items: config },
      ]}
      bottomNav={[
        { href: "/admin", labelKey: "admin.nav.dashboard", icon: <LayoutDashboard /> },
        {
          href: "/admin/affiliates",
          labelKey: "admin.nav.affiliates",
          icon: <Users />,
          matchPrefix: true,
          badge: pendingApplications,
        },
        { href: "/admin/leads", labelKey: "admin.nav.leads", icon: <ListChecks /> },
        { href: "/admin/sales", labelKey: "admin.nav.sales", icon: <ShoppingBag /> },
        {
          href: "/admin/payouts",
          labelKey: "common.mobileMore",
          icon: <Wallet />,
          badge: pendingPayouts,
        },
      ]}
      user={{ name: admin.name, email: admin.email }}
      profileHref="/admin/settings"
      homeHref="/admin"
      notifications={rawNotifications.map((entry) => renderNotification(entry, t))}
      unreadCount={unreadCount}
      notificationsHref="/admin/notifications"
    >
      {children}
    </AppShell>
  );
}
