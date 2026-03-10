import { getServerSession } from "next-auth";
import { getDictionary } from "@/lib/dictionary";
import { getPlatformSettings } from "@/lib/platform";
import type { Locale } from "@/lib/i18n";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { Badge, Card, Alert } from "@/components/ui/index";
import { TransactionActions } from "@/components/dashboard/transaction-actions";
import { ArrowUpDown, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Transactions" };

export default async function TransactionsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const userLang = (session.user.language || "en") as Locale;
  const platform = await getPlatformSettings();
  const dict = await getDictionary(userLang, platform);
  const tt = dict.txnPage || {};
  const t = dict.dashboardTransactions;
  const c = dict.common;
  const txnTypes = (dict as any).transactionTypes || {} as any;

  const transactions = await prisma.transaction.findMany({
    where: { userId: session.user.id },
    include: { beneficiary: { select: { name: true } }, locks: { orderBy: { percentage: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  const statusVariant = (s: string): "success" | "warning" | "danger" | "info" | "neutral" => {
    const map: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = { COMPLETED: "success", PENDING: "warning", LOCKED: "danger", PROCESSING: "info", REJECTED: "danger", CANCELLED: "neutral", INITIALIZED: "neutral" };
    return map[s] ?? "neutral";
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"><ArrowUpDown size={20} className="text-accent" /></div>
        <div><h1 className="text-xl font-bold text-slate-800 font-heading">{t.title}</h1><p className="text-sm text-slate-500">{(t.subtitle || "{{count}} transaction(s)").replace("{{count}}", String(transactions.length))}</p></div>
      </div>
      {transactions.length === 0 ? (
        <Card><div className="px-6 py-16 text-center"><ArrowUpDown size={48} className="mx-auto mb-3 text-slate-300" /><p className="text-sm text-slate-500">{t.noTransactions}</p></div></Card>
      ) : (
        <div className="space-y-4">
          {transactions.map((txn) => {
            const isCredit = ["ADMIN_CREDIT", "DEPOSIT", "LOAN_DISBURSEMENT"].includes(txn.type);
            return (
              <Card key={txn.id}><div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isCredit ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>{isCredit ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}</div>
                    <div><p className="text-sm font-semibold text-slate-800">{txnTypes[txn.type] || txn.type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())}</p><p className="text-xs text-slate-400">{timeAgo(txn.createdAt, userLang)}</p></div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${isCredit ? "text-emerald-600" : "text-red-600"}`}>{isCredit ? "+" : "-"}{formatCurrency(Number(txn.amount), txn.currency)}</p>
                    <Badge variant={statusVariant(txn.status)}>{(c as any)[txn.status.toLowerCase()] || txn.status}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
                  <div><p className="text-slate-400">{t.reference}</p><p className="font-mono text-slate-600 mt-0.5">{txn.reference}</p></div>
                  {txn.beneficiary && (<div><p className="text-slate-400">{t.to}</p><p className="text-slate-700 font-medium mt-0.5">{txn.beneficiary.name}</p></div>)}
                  {txn.description && (<div className="col-span-2"><p className="text-slate-400">{t.descriptionLabel}</p><p className="text-slate-600 mt-0.5">{txn.description}</p></div>)}
                </div>
                {txn.adminNote && txn.status === "REJECTED" && (<Alert variant="danger" className="!py-2 !text-xs mb-3">{t.rejectionReason}: {txn.adminNote}</Alert>)}
                <TransactionActions transactionId={txn.id} reference={txn.reference} amount={Number(txn.amount)} currency={txn.currency} beneficiaryName={txn.beneficiary?.name ?? "Recipient"} status={txn.status} progress={txn.progress} locks={txn.locks.map((l) => ({ id: l.id, motif: l.motif, percentage: l.percentage, isResolved: l.isResolved }))} />
              </div></Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
