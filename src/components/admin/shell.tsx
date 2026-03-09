"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Home, Users, Shield, ArrowUpDown, CreditCard, FileText, Settings, ClipboardList, LogOut, Menu } from "lucide-react";

interface Props {
  user: { name: string };
  platformName: string;
  children: React.ReactNode;
}

export function AdminShell({ user, platformName, children }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Always French
  const links = [
    { href: "/admin", label: "Tableau de bord", icon: Home, exact: true },
    { href: "/admin/users", label: "Utilisateurs", icon: Users },
    { href: "/admin/kyc", label: "Vérification KYC", icon: Shield },
    { href: "/admin/transactions", label: "Transactions", icon: ArrowUpDown },
    { href: "/admin/cards", label: "Cartes", icon: CreditCard },
    { href: "/admin/loans", label: "Demandes de prêt", icon: FileText },
    { href: "/admin/settings", label: "Paramètres", icon: Settings },
    { href: "/admin/logs", label: "Journal d'audit", icon: ClipboardList },
  ];

  const isActive = (href: string, exact?: boolean) => exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex min-h-screen">
      <aside className={cn("fixed inset-y-0 left-0 z-50 w-64 bg-primary transform transition-transform duration-200 lg:translate-x-0 lg:static", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
            <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center"><svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div>
            <div><span className="text-lg font-bold text-white font-heading tracking-tight">{platformName}</span><span className="block text-xs text-slate-400 -mt-0.5">Administration</span></div>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className={cn("flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors duration-150", isActive(link.href, link.exact) ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white")}><link.icon size={20} /> {link.label}</Link>
            ))}
          </nav>
          <div className="px-4 py-4 border-t border-white/10">
            <div className="flex items-center gap-3 px-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white text-sm font-semibold">{user.name[0]}</div>
              <div><p className="text-sm font-medium text-white truncate">{user.name}</p><p className="text-xs text-slate-400">Administrateur</p></div>
            </div>
            <button onClick={() => signOut({ callbackUrl: "/" })} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-red-400 hover:bg-white/5 w-full transition-colors"><LogOut size={20} /> Déconnexion</button>
          </div>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-slate-200">
          <div className="flex items-center px-6 py-3"><button onClick={() => setOpen(!open)} className="lg:hidden text-slate-600"><Menu size={24} /></button></div>
        </header>
        <main className="flex-1 p-6"><div className="page-transition">{children}</div></main>
      </div>
    </div>
  );
}
