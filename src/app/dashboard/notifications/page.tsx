import { getServerSession } from "next-auth";
import { getDictionary } from "@/lib/dictionary";
import { getPlatformSettings } from "@/lib/platform";
import type { Locale } from "@/lib/i18n";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationList } from "@/components/dashboard/notification-list";
import { Card } from "@/components/ui/index";
import { Bell } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const userLang = (session.user.language || "en") as Locale;
  const platform = await getPlatformSettings();
  const dict = await getDictionary(userLang, platform);
  const t = dict.dashboardNotifications;

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id }, orderBy: { createdAt: "desc" },
    select: { id: true, title: true, message: true, type: true, isRead: true, createdAt: true },
  });
  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"><Bell size={20} className="text-accent" /></div>
        <div><h1 className="text-xl font-bold text-slate-800 font-heading">{t.title}</h1><p className="text-sm text-slate-500">{notifications.length} - {unread} {t.unread?.toLowerCase()}</p></div>
      </div>
      {notifications.length === 0 ? (
        <Card><div className="px-6 py-16 text-center"><Bell size={48} className="mx-auto mb-3 text-slate-300" /><h3 className="text-lg font-semibold text-slate-800 font-heading">{t.allCaughtUp}</h3><p className="mt-2 text-sm text-slate-500">{t.noNotifications}</p></div></Card>
      ) : (
        <NotificationList notifications={notifications.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() }))} unreadCount={unread} />
      )}
    </div>
  );
}
