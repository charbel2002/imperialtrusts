"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "./notification-bell";
import { Home, ArrowUpDown, Send, CreditCard, Users, Shield, Bell, LogOut, Menu } from "lucide-react";

interface NotificationData { id: string; title: string; message: string; type: string; isRead: boolean; createdAt: Date; }

interface Props {
  user: { id: string; name: string; email: string; role: string; accountNumber: string | null };
  dict: Record<string, any>;
  platformName: string;
  unreadCount: number;
  recentNotifications: NotificationData[];
  children: React.ReactNode;
}

export function DashboardShell({ user, dict, platformName, unreadCount, recentNotifications, children }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const d = dict.dashboard || {};

  const sidebarLinks = [
    { href: "/dashboard", label: d.overview || "Overview", icon: Home, exact: true },
    { href: "/dashboard/transactions", label: d.transactions || "Transactions", icon: ArrowUpDown },
    { href: "/dashboard/transfers", label: d.sendMoney || "Send Money", icon: Send },
    { href: "/dashboard/cards", label: d.cards || "Cards", icon: CreditCard },
    { href: "/dashboard/beneficiaries", label: d.beneficiaries || "Beneficiaries", icon: Users },
    { href: "/dashboard/kyc", label: d.kyc || "KYC Verification", icon: Shield },
  ];
  const bottomLinks = [
    { href: "/dashboard/notifications", label: d.notifications || "Notifications", icon: Bell },
  ];

  const isActive = (href: string, exact?: boolean) => exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex min-h-screen">
      <aside className={cn("fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 lg:translate-x-0 lg:static", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center"><svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div>
            <span className="text-lg font-bold text-primary tracking-tight font-heading">{platformName}</span>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {sidebarLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className={cn("flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors duration-150", isActive(link.href, link.exact) ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-800")}><link.icon size={20} />{link.label}</Link>
            ))}
            <div className="pt-4 mt-4 border-t border-slate-100">
              {bottomLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className={cn("flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors duration-150", isActive(link.href) ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-100")}>
                  <link.icon size={20} />{link.label}
                  {link.href.endsWith("/notifications") && unreadCount > 0 && (
                    <span className={cn("ml-auto w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center", isActive(link.href) ? "bg-white/20 text-white" : "bg-red-500 text-white")}>{unreadCount > 9 ? "9+" : unreadCount}</span>
                  )}
                </Link>
              ))}
            </div>
          </nav>
          <div className="px-4 py-4 border-t border-slate-100">
            <div className="flex items-center gap-3 px-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold">{user.name.charAt(0).toUpperCase()}</div>
              <div className="min-w-0"><p className="text-sm font-medium text-slate-800 truncate">{user.name}</p><p className="text-xs text-slate-500 truncate">{user.accountNumber}</p></div>
            </div>
            <button onClick={() => signOut({ callbackUrl: "/" })} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 hover:text-red-600 w-full transition-colors"><LogOut size={20} /> {d.signOut || "Sign Out"}</button>
          </div>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-slate-200">
          <div className="flex items-center justify-between px-6 py-3">
            <button onClick={() => setOpen(!open)} className="lg:hidden text-slate-600"><Menu size={24} /></button>
            <div className="flex items-center gap-3 ml-auto">
              <NotificationBell initialCount={unreadCount} initialNotifications={recentNotifications} />
            </div>
          </div>
        </header>
        <main className="flex-1 p-6"><div className="page-transition">{children}</div></main>
      </div>
    </div>
  );
}
