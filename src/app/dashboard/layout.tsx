import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/lib/dictionary";
import { getPlatformSettings } from "@/lib/platform";
import { DashboardShell } from "@/components/dashboard/shell";
import { DictProvider } from "@/components/shared/dict-provider";
import type { Locale } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const platform = await getPlatformSettings();
  return {
    title: {
      default: `Dashboard | ${platform.name}`,
      template: `%s | ${platform.name}`,
    },
  };
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/en/login");

  const userLang = (session.user.language || "en") as Locale;
  const platform = await getPlatformSettings();
  const [dict, unreadCount, recentNotifications] = await Promise.all([
    getDictionary(userLang, platform),
    prisma.notification.count({ where: { userId: session.user.id, isRead: false } }),
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, title: true, message: true, type: true, isRead: true, createdAt: true },
    }),
  ]);

  return (
    <DictProvider dict={dict}>
      <DashboardShell
        user={session.user}
        dict={dict}
        platformName={platform.name}
        unreadCount={unreadCount}
        recentNotifications={recentNotifications}
      >
        {children}
      </DashboardShell>
    </DictProvider>
  );
}
