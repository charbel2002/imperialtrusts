import { formatDate } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Badge, Card, CardBody } from "@/components/ui/index";
import { AdminLoanActions } from "@/components/admin/admin-loan-actions";
import { FileText, Euro, Clock, Calendar, Percent, Mail, Phone, User } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Demandes de prêt" };

export default async function AdminLoansPage() {
  const loans = await prisma.loanApplication.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, account: { select: { id: true } } } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const pending = loans.filter((l) => l.status === "PENDING");
  const approved = loans.filter((l) => l.status === "APPROVED");
  const rejected = loans.filter((l) => l.status === "REJECTED");

  const totalRequested = loans.reduce((s, l) => s + Number(l.amount), 0);
  const totalApproved = approved.reduce((s, l) => s + Number(l.amount), 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <FileText size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 font-heading">Demandes de prêt</h1>
          <p className="text-sm text-slate-500">{pending.length} en attente de révision</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        {[
          { label: "Total", value: loans.length, color: "text-primary" },
          { label: "En attente", value: pending.length, color: "text-amber-600" },
          { label: "Approuvées", value: approved.length, color: "text-emerald-600" },
          { label: "Rejetées", value: rejected.length, color: "text-red-600" },
          { label: "Volume approuvé", value: formatCurrency(totalApproved), color: "text-primary", isText: true },
        ].map((s) => (
          <Card key={s.label}><div className="px-4 py-3">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{s.label}</p>
            <p className={`text-xl font-bold font-heading ${s.color}`}>{s.value}</p>
          </div></Card>
        ))}
      </div>

      {/* Pending Queue */}
      {pending.length > 0 && (
        <div className="mb-10">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
            En attente de révision ({pending.length})
          </h2>
          <div className="space-y-4">
            {pending.map((loan) => (
              <LoanCard key={loan.id} loan={loan} showActions />
            ))}
          </div>
        </div>
      )}

      {pending.length === 0 && (
        <Card className="mb-10">
          <div className="px-6 py-12 text-center">
            <FileText size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm text-slate-500">Aucune demande de prêt en attente</p>
          </div>
        </Card>
      )}

      {/* Reviewed History */}
      {(approved.length > 0 || rejected.length > 0) && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
            Historique des révisions ({approved.length + rejected.length})
          </h2>
          <div className="space-y-4">
            {[...approved, ...rejected]
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .map((loan) => (
                <LoanCard key={loan.id} loan={loan} showActions={false} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Loan Card Component ------------------------------------

function LoanCard({ loan, showActions = true }: { loan: any; showActions?: boolean }) {
  const statusVariant = loan.status === "APPROVED" ? "success" : loan.status === "REJECTED" ? "danger" : "warning";
  const hasUser = !!loan.user;
  const hasAccount = !!loan.user?.account;

  return (
    <Card>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {loan.user?.name?.charAt(0)?.toUpperCase() ?? loan.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {loan.user?.name ?? "Candidat non inscrit"}
              </p>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Mail size={10} /> {loan.email}
              </p>
              {loan.phone && (
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Phone size={10} /> {loan.phone}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={statusVariant}>
              {loan.status.charAt(0) + loan.status.slice(1).toLowerCase()}
            </Badge>
            <span className="text-xs text-slate-400">
              {formatDate(loan.createdAt, "fr", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
        </div>

        {/* Loan Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 mb-5">
          <DetailItem icon={Euro} label="Montant du prêt" value={formatCurrency(Number(loan.amount))} highlight />
          <DetailItem icon={Calendar} label="Durée" value={`${loan.durationMonths} mois`} />
          <DetailItem icon={Percent} label="Taux d'intérêt" value={`${Number(loan.interestRate)}% TAE`} />
          <DetailItem icon={Clock} label="Mensualité" value={formatCurrency(Number(loan.monthlyPayment))} />
        </div>

        {/* Repayment Summary */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10 mb-5">
          <span className="text-xs text-slate-500">Remboursement total</span>
          <span className="text-sm font-bold text-primary font-heading">
            {formatCurrency(Number(loan.totalRepayment))}
          </span>
        </div>

        {/* User Status Info */}
        {hasUser && (
          <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
            <span className="flex items-center gap-1">
              <User size={10} /> Utilisateur inscrit
            </span>
            {hasAccount && (
              <span className="flex items-center gap-1 text-emerald-600">
                <Euro size={10} /> Possède un compte bancaire (éligible au versement)
              </span>
            )}
          </div>
        )}

        {!hasUser && (
          <p className="text-xs text-slate-400 mb-4">
            Candidature externe — aucun compte enregistré. Versement automatique impossible.
          </p>
        )}

        {/* Admin Note */}
        {loan.adminNote && (
          <div className={`p-3 rounded-lg border mb-4 ${loan.status === "REJECTED" ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"}`}>
            <p className={`text-xs font-medium ${loan.status === "REJECTED" ? "text-red-700" : "text-emerald-700"}`}>
              Note admin
            </p>
            <p className={`text-xs mt-0.5 ${loan.status === "REJECTED" ? "text-red-600" : "text-emerald-600"}`}>
              {loan.adminNote}
            </p>
          </div>
        )}

        {/* Actions */}
        {showActions && loan.status === "PENDING" && (
          <AdminLoanActions
            loanId={loan.id}
            email={loan.email}
            amount={Number(loan.amount)}
            hasAccount={hasAccount}
            userName={loan.user?.name}
          />
        )}
      </div>
    </Card>
  );
}

function DetailItem({ icon: Icon, label, value, highlight }: { icon: any; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</p>
        <p className={`text-sm mt-0.5 ${highlight ? "font-bold text-primary font-heading" : "font-medium text-slate-700"}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
