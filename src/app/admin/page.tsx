import { prisma } from "@/lib/prisma";
import { formatCurrency, timeAgo, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Badge, Card, CardBody, CardHeader, Alert } from "@/components/ui/index";
import { DashboardCharts } from "@/components/admin/dashboard-charts";
import {
  LayoutDashboard, Users, Wallet, CreditCard, ArrowUpDown,
  Shield, FileText, AlertTriangle, ArrowRight, Clock,
  TrendingUp, DollarSign, UserCheck, Activity,
} from "lucide-react";

export default async function AdminDashboardPage() {
  // -- Aggregate all stats in parallel ----------------------
  const [
    userCount,
    activeAccounts,
    lockedAccounts,
    totalBalance,
    cardCount,
    activeCards,
    transactionCount,
    completedTransactions,
    pendingTransactions,
    processingTransactions,
    totalTransactionVolume,
    kycPending,
    kycApproved,
    kycRejected,
    loansPending,
    loansApproved,
    totalLoanVolume,
    recentLogs,
    recentTransactions,
    transactionsByType,
    last30DaysTransactions,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.account.count({ where: { status: "ACTIVE" } }),
    prisma.account.count({ where: { status: { in: ["LOCKED", "SUSPENDED"] } } }),
    prisma.account.aggregate({ _sum: { balance: true } }),
    prisma.card.count(),
    prisma.card.count({ where: { status: "ACTIVE" } }),
    prisma.transaction.count(),
    prisma.transaction.count({ where: { status: "COMPLETED" } }),
    prisma.transaction.count({ where: { status: "PENDING" } }),
    prisma.transaction.count({ where: { status: "PROCESSING" } }),
    prisma.transaction.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }),
    prisma.kycDocument.count({ where: { status: "PENDING" } }),
    prisma.kycDocument.count({ where: { status: "APPROVED" } }),
    prisma.kycDocument.count({ where: { status: "REJECTED" } }),
    prisma.loanApplication.count({ where: { status: "PENDING" } }),
    prisma.loanApplication.count({ where: { status: "APPROVED" } }),
    prisma.loanApplication.aggregate({ where: { status: "APPROVED" }, _sum: { amount: true } }),
    prisma.adminLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { admin: { select: { name: true } } } }),
    prisma.transaction.findMany({
      where: { status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { name: true } } },
    }),
    prisma.transaction.groupBy({ by: ["type"], where: { status: "COMPLETED" }, _count: true, _sum: { amount: true } }),
    prisma.transaction.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, status: "COMPLETED" },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const platformBalance = Number(totalBalance._sum.balance ?? 0);
  const txnVolume = Number(totalTransactionVolume._sum.amount ?? 0);
  const loanVolume = Number(totalLoanVolume._sum.amount ?? 0);
  const pendingItems = pendingTransactions + kycPending + loansPending;

  // Build chart data
  const txnTypeData = transactionsByType.map((t) => ({
    type: t.type.replace(/_/g, " "),
    count: t._count,
    volume: Number(t._sum.amount ?? 0),
  }));

  const kycData = [
    { name: "Approuvés", value: kycApproved, color: "#10B981" },
    { name: "En attente", value: kycPending, color: "#F59E0B" },
    { name: "Rejetés", value: kycRejected, color: "#EF4444" },
  ].filter((d) => d.value > 0);

  // Group last 30 days transactions by day
  const dailyVolume: Record<string, number> = {};
  last30DaysTransactions.forEach((t) => {
    const day = t.createdAt.toISOString().split("T")[0];
    dailyVolume[day] = (dailyVolume[day] ?? 0) + Number(t.amount);
  });
  const volumeChartData = Object.entries(dailyVolume).map(([date, amount]) => ({
    date: formatDate(date, "fr", { month: "short", day: "numeric" }),
    amount,
  }));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <LayoutDashboard size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 font-heading">Tableau de bord</h1>
          <p className="text-sm text-slate-500">Vue d&apos;ensemble et indicateurs clés</p>
        </div>
      </div>

      {/* Pending Items Alert */}
      {pendingItems > 0 && (
        <Alert variant="warning" className="mb-6">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Éléments en attente de révision</p>
            <div className="flex flex-wrap gap-3 mt-1.5 text-xs">
              {pendingTransactions > 0 && (
                <Link href="/admin/transactions" className="underline hover:no-underline">
                  {pendingTransactions} transaction{pendingTransactions !== 1 ? "s" : ""}
                </Link>
              )}
              {kycPending > 0 && (
                <Link href="/admin/kyc" className="underline hover:no-underline">
                  {kycPending} soumission{kycPending !== 1 ? "s" : ""} KYC
                </Link>
              )}
              {loansPending > 0 && (
                <Link href="/admin/loans" className="underline hover:no-underline">
                  {loansPending} demande{loansPending !== 1 ? "s" : ""} de prêt
                </Link>
              )}
            </div>
          </div>
        </Alert>
      )}

      {/* === KPI CARDS === */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Utilisateurs" value={userCount} sub={`${activeAccounts} actifs`} color="text-primary" />
        <StatCard icon={DollarSign} label="Solde plateforme" value={formatCurrency(platformBalance)} sub={`${lockedAccounts} comptes verrouillés`} color="text-emerald-600" />
        <StatCard icon={ArrowUpDown} label="Transactions" value={transactionCount} sub={`${formatCurrency(txnVolume)} volume`} color="text-secondary" />
        <StatCard icon={TrendingUp} label="Volume de prêts" value={formatCurrency(loanVolume)} sub={`${loansApproved} approuvés`} color="text-accent" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard icon={CreditCard} label="Cartes émises" value={cardCount} sub={`${activeCards} actives`} color="text-primary" />
        <StatCard icon={Shield} label="KYC vérifiés" value={kycApproved} sub={`${kycPending} en attente`} color="text-emerald-600" />
        <StatCard icon={Clock} label="Txns en attente" value={pendingTransactions + processingTransactions} sub="en attente de révision" color="text-amber-600" />
        <StatCard icon={UserCheck} label="Comptes actifs" value={activeAccounts} sub={`sur ${userCount} au total`} color="text-secondary" />
      </div>

      {/* === CHARTS === */}
      <DashboardCharts
        volumeData={volumeChartData}
        txnTypeData={txnTypeData}
        kycData={kycData}
      />

      {/* === BOTTOM SECTION: Recent Activity + Recent Txns === */}
      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800 font-heading">Transactions récentes complétées</h3>
            <Link href="/admin/transactions" className="text-xs text-secondary hover:underline flex items-center gap-1">
              Voir tout <ArrowRight size={12} />
            </Link>
          </CardHeader>
          <div className="divide-y divide-slate-50">
            {recentTransactions.length === 0 ? (
              <div className="px-6 py-8 text-center text-xs text-slate-400">Aucune transaction complétée</div>
            ) : (
              recentTransactions.map((txn) => (
                <div key={txn.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <DollarSign size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-700">{txn.user.name}</p>
                      <p className="text-[10px] text-slate-400">{txn.type.replace(/_/g, " ")} - {timeAgo(txn.createdAt)}</p>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-emerald-600">{formatCurrency(Number(txn.amount))}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Admin Activity Log */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800 font-heading">Activité admin</h3>
            <Link href="/admin/logs" className="text-xs text-secondary hover:underline flex items-center gap-1">
              Voir tout <ArrowRight size={12} />
            </Link>
          </CardHeader>
          <div className="divide-y divide-slate-50">
            {recentLogs.length === 0 ? (
              <div className="px-6 py-8 text-center text-xs text-slate-400">Aucune activité</div>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="px-5 py-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
                    <Activity size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-700">
                      <span className="font-medium">{log.admin.name}</span>{" "}
                      <span className="text-slate-500">{log.action.replace(/_/g, " ").toLowerCase()}</span>
                    </p>
                    {log.description && (
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{log.description}</p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(log.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

// --- Stat Card ----------------------------------------------

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string | number; sub: string; color: string;
}) {
  return (
    <Card>
      <CardBody className="!py-4 !px-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</p>
          <Icon size={16} className="text-slate-300" />
        </div>
        <p className={`text-xl font-bold font-heading ${color}`}>{value}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
      </CardBody>
    </Card>
  );
}
