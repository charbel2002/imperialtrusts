import { prisma } from "@/lib/prisma";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { Badge, Card } from "@/components/ui/index";
import { AdminTransactionActions } from "@/components/admin/admin-transaction-actions";
import { ArrowUpDown, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Transactions" };

export default async function AdminTransactionsPage() {
  const transactions = await prisma.transaction.findMany({
    include: {
      user: { select: { name: true, email: true } },
      beneficiary: { select: { name: true } },
      locks: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const pending = transactions.filter((t) => t.status === "PENDING");
  const locked = transactions.filter((t) => t.status === "LOCKED");
  const stats = {
    total: transactions.length,
    pending: pending.length,
    locked: locked.length,
    completed: transactions.filter((t) => t.status === "COMPLETED").length,
    rejected: transactions.filter((t) => t.status === "REJECTED").length,
  };

  const statusVariant = (s: string): "success" | "warning" | "danger" | "info" | "neutral" => {
    const map: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
      COMPLETED: "success", PENDING: "warning", LOCKED: "danger",
      PROCESSING: "info", REJECTED: "danger", CANCELLED: "neutral", INITIALIZED: "neutral",
    };
    return map[s] ?? "neutral";
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <ArrowUpDown size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 font-heading">Transaction Management</h1>
          <p className="text-sm text-slate-500">{stats.pending} pending - {stats.locked} locked</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        {[
          { label: "Total", value: stats.total, color: "text-primary" },
          { label: "Pending", value: stats.pending, color: "text-amber-600" },
          { label: "Locked", value: stats.locked, color: "text-red-600" },
          { label: "Completed", value: stats.completed, color: "text-emerald-600" },
          { label: "Rejected", value: stats.rejected, color: "text-red-500" },
        ].map((s) => (
          <Card key={s.label}><div className="px-4 py-3">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-bold font-heading ${s.color}`}>{s.value}</p>
          </div></Card>
        ))}
      </div>

      {/* Transactions Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reference</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">To</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.map((txn) => {
                const isCredit = ["ADMIN_CREDIT", "DEPOSIT", "LOAN_DISBURSEMENT"].includes(txn.type);
                return (
                  <tr key={txn.id} className={`hover:bg-slate-50/50 transition-colors ${txn.status === "PENDING" ? "bg-amber-50/30" : txn.status === "LOCKED" ? "bg-red-50/20" : ""}`}>
                    <td className="px-5 py-3">
                      <p className="text-xs font-mono text-slate-600">{txn.reference}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-xs font-medium text-slate-800">{txn.user.name}</p>
                      <p className="text-[10px] text-slate-400">{txn.user.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isCredit ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
                          {isCredit ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                        </div>
                        <span className="text-xs text-slate-600">{txn.type.replace(/_/g, " ")}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className={`text-sm font-semibold ${isCredit ? "text-emerald-600" : "text-slate-800"}`}>
                        {formatCurrency(Number(txn.amount), txn.currency)}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-xs text-slate-600">{txn.beneficiary?.name ?? "-"}</p>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={statusVariant(txn.status)}>{txn.status}</Badge>
                      {txn.locks.length > 0 && (
                        <span className="ml-1 text-[9px] text-slate-400">
                          ({txn.locks.filter((l) => l.isResolved).length}/{txn.locks.length} locks)
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-[10px] text-slate-400">{timeAgo(txn.createdAt)}</p>
                    </td>
                    <td className="px-5 py-3">
                      <AdminTransactionActions
                        transactionId={txn.id}
                        status={txn.status}
                        reference={txn.reference}
                        userName={txn.user.name}
                        amount={Number(txn.amount)}
                        currency={txn.currency}
                        maxLockPercentage={txn.locks.length > 0 ? Math.max(...txn.locks.map((l) => l.percentage)) : 0}
                      />
                    </td>
                  </tr>
                );
              })}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <ArrowUpDown size={40} className="mx-auto mb-3 text-slate-300" />
                    <p className="text-sm">No transactions yet</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
