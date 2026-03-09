import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/lib/dictionary";
import { getPlatformSettings } from "@/lib/platform";
import { formatCurrency, timeAgo } from "@/lib/utils";
import Link from "next/link";
import { Badge, Alert, Card, CardBody } from "@/components/ui/index";
import { ArrowDownLeft, ArrowUpRight, Send, CreditCard, AlertTriangle } from "lucide-react";
import type { Locale } from "@/lib/i18n";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const userLang = (session.user.language || "en") as Locale;
  const platform = await getPlatformSettings();
  const dict = await getDictionary(userLang, platform);
  const t = dict.dashboard || {};

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { account: true, kycDocument: true, cards: { select: { id: true } } },
  });

  const recentTxns = await prisma.transaction.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const account = user?.account;
  const kycStatus = user?.kycDocument?.status ?? "NOT_SUBMITTED";
  const isKycApproved = kycStatus === "APPROVED";
  const cardCount = user?.cards.length ?? 0;

  return (
    <div>
      {account && account.status !== "ACTIVE" && (
        <Alert variant="danger" className="mb-6">
          <AlertTriangle size={20} className="flex-shrink-0" />
          <div>
            <p className="font-medium">
              {account.status === "LOCKED" ? (t.accountLocked || "Account Locked") : (t.accountSuspended || "Account Suspended")}
            </p>
            <p className="text-sm mt-0.5">
              {account.status === "LOCKED" ? (t.accountLockedMsg || "Your account has been locked.") : (t.accountSuspendedMsg || "Operations temporarily disabled.")}
            </p>
          </div>
        </Alert>
      )}

      {!isKycApproved && (
        <Alert variant="warning" className="mb-6">
          <AlertTriangle size={20} className="flex-shrink-0" />
          <div>
            <p className="font-medium">{t.kycRequired || "KYC Verification Required"}</p>
            <p className="text-sm mt-0.5">
              {t.kycRequiredMsg || "Complete identity verification to unlock all features."}{" "}
              <Link href="/dashboard/kyc" className="underline font-medium">{t.verifyNow || "Verify now"} &rarr;</Link>
            </p>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="col-span-1 md:col-span-2 rounded-xl bg-gradient-to-br from-primary to-secondary-700 text-white p-8">
          <p className="text-sm text-slate-300 mb-1">{t.balance || "Available Balance"}</p>
          <h2 className="text-3xl font-bold font-heading tracking-tight">
            {formatCurrency(Number(account?.balance ?? 0), account?.currency ?? "USD")}
          </h2>
          <div className="mt-4 flex items-center gap-3 text-sm text-slate-300">
            <span>{t.account || "Account"}: {account?.accountNumber ?? "-"}</span>
          </div>
          <div className="mt-6 flex gap-3">
            <Link href="/dashboard/transfers" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 border border-white/20 text-sm transition-colors">
              <Send size={16} /> {t.sendMoney || "Send Money"}
            </Link>
            <Link href="/dashboard/cards" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 border border-white/20 text-sm transition-colors">
              <CreditCard size={16} /> {t.cards || "Cards"}
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardBody>
              <p className="text-xs text-slate-500 uppercase tracking-wider">{t.kycStatus || "KYC Status"}</p>
              <div className="mt-2">
                <Badge variant={kycStatus === "APPROVED" ? "success" : kycStatus === "PENDING" ? "warning" : kycStatus === "REJECTED" ? "danger" : "neutral"}>
                  {kycStatus === "NOT_SUBMITTED" ? (dict.common?.notSubmitted || "Not Submitted") : kycStatus.charAt(0) + kycStatus.slice(1).toLowerCase()}
                </Badge>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs text-slate-500 uppercase tracking-wider">{t.accountStatus || "Account Status"}</p>
              <div className="mt-2">
                <Badge variant={account?.status === "ACTIVE" ? "success" : "danger"}>
                  {account?.status ?? "Unknown"}
                </Badge>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs text-slate-500 uppercase tracking-wider">{t.cards || "Cards"}</p>
              <p className="mt-1 text-xl font-bold text-slate-800">{cardCount}</p>
            </CardBody>
          </Card>
        </div>
      </div>

      <Card>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800 font-heading">{t.recentTxns || "Recent Transactions"}</h3>
          <Link href="/dashboard/transactions" className="text-sm text-secondary hover:underline">{t.viewAll || "View all"} &rarr;</Link>
        </div>
        <div className="divide-y divide-slate-50">
          {recentTxns.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400">
              <ArrowUpRight size={48} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm">{t.noTxns || "No transactions yet"}</p>
            </div>
          ) : (
            recentTxns.map((txn) => {
              const isCredit = ["ADMIN_CREDIT", "DEPOSIT", "LOAN_DISBURSEMENT"].includes(txn.type);
              return (
                <div key={txn.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCredit ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
                      {isCredit ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {txn.type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </p>
                      <p className="text-xs text-slate-500">{timeAgo(txn.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${isCredit ? "text-emerald-600" : "text-red-600"}`}>
                      {isCredit ? "+" : "-"}{formatCurrency(Number(txn.amount), txn.currency)}
                    </p>
                    <Badge variant={txn.status === "COMPLETED" ? "success" : txn.status === "REJECTED" ? "danger" : "warning"} className="text-[10px]">
                      {txn.status}
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
