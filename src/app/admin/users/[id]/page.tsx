import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency, timeAgo, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Badge, Card, CardBody, CardHeader } from "@/components/ui/index";
import { AccountStatusActions } from "@/components/admin/account-status-actions";
import { AccountCurrencyActions } from "@/components/admin/account-currency-actions";
import { CreditDebitForm } from "@/components/admin/credit-debit-form";
import { UserToggleActive } from "@/components/admin/user-toggle-active";
import {
  ArrowLeft, User, Wallet, Shield, CreditCard,
  ArrowDownLeft, ArrowUpRight, Clock,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Détail utilisateur" };

export default async function AdminUserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      account: true,
      kycDocument: { select: { status: true, fullLegalName: true, reviewedAt: true } },
      cards: { select: { id: true, cardType: true, status: true } },
      _count: { select: { transactions: true, beneficiaries: true, notifications: true } },
    },
  });

  if (!user) notFound();

  const recentTxns = await prisma.transaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const account = user.account;
  const kycStatus = user.kycDocument?.status ?? "NONE";

  return (
    <div>
      {/* Back Link */}
      <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
        <ArrowLeft size={16} /> Retour aux utilisateurs
      </Link>

      {/* User Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-800 font-heading">{user.name}</h1>
              {user.role === "ADMIN" && <Badge variant="info">Admin</Badge>}
              {!user.isActive && <Badge variant="danger">Désactivé</Badge>}
            </div>
            <p className="text-sm text-slate-500">{user.email}</p>
            <p className="text-xs text-slate-400">Inscrit le {formatDate(user.createdAt, "fr")}</p>
          </div>
        </div>
        {user.role !== "ADMIN" && (
          <UserToggleActive userId={user.id} isActive={user.isActive} userName={user.name} />
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Account + Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet size={18} className="text-slate-500" />
                <h2 className="text-base font-semibold text-slate-800 font-heading">Compte bancaire</h2>
              </div>
              <Badge variant={
                account?.status === "ACTIVE" ? "success" :
                account?.status === "LOCKED" ? "danger" : "warning"
              }>
                {account?.status ?? "N/A"}
              </Badge>
            </CardHeader>
            <CardBody>
              {account ? (
                <>
                  <div className="grid sm:grid-cols-3 gap-6 mb-6">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider">Numéro de compte</p>
                      <p className="mt-1 text-sm font-mono font-semibold text-slate-800">{account.accountNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider">Solde</p>
                      <p className="mt-1 text-xl font-bold text-slate-800 font-heading">
                        {formatCurrency(Number(account.balance), account.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider">Devise</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">{account.currency}</p>
                    </div>
                  </div>
                  {account.iban && (
                    <div className="mb-6">
                      <p className="text-xs text-slate-400 uppercase tracking-wider">IBAN</p>
                      <p className="mt-1 text-sm font-mono text-slate-700">{account.iban}</p>
                    </div>
                  )}

                  {/* Account Status Actions */}
                  <div className="pt-5 border-t border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Contrôles du compte</h3>
                    <AccountStatusActions
                      accountId={account.id}
                      currentStatus={account.status}
                      userName={user.name}
                    />
                  </div>

                  {/* Account Currency Actions */}
                  <div className="pt-5 border-t border-slate-100">
                    <AccountCurrencyActions
                      accountId={account.id}
                      currentCurrency={account.currency}
                      userName={user.name}
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500">Aucun compte bancaire trouvé pour cet utilisateur.</p>
              )}
            </CardBody>
          </Card>

          {/* Credit / Debit */}
          {account && (
            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold text-slate-800 font-heading">Créditer / Débiter le compte</h2>
              </CardHeader>
              <CardBody>
                <CreditDebitForm
                  accountId={account.id}
                  userName={user.name}
                  currentBalance={Number(account.balance)}
                  currency={account.currency}
                />
              </CardBody>
            </Card>
          )}

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-slate-800 font-heading">Transactions récentes</h2>
            </CardHeader>
            <div className="divide-y divide-slate-50">
              {recentTxns.length === 0 ? (
                <div className="px-6 py-10 text-center text-slate-400">
                  <Clock size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">Aucune transaction</p>
                </div>
              ) : (
                recentTxns.map((txn) => {
                  const isCredit = ["ADMIN_CREDIT", "DEPOSIT", "LOAN_DISBURSEMENT"].includes(txn.type);
                  return (
                    <div key={txn.id} className="px-6 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCredit ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
                          {isCredit ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-700">{txn.type.replace(/_/g, " ")}</p>
                          <p className="text-[10px] text-slate-400">{timeAgo(txn.createdAt)} - {txn.reference}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-semibold ${isCredit ? "text-emerald-600" : "text-red-600"}`}>
                          {isCredit ? "+" : "-"}{formatCurrency(Number(txn.amount), txn.currency)}
                        </p>
                        <Badge variant={txn.status === "COMPLETED" ? "success" : txn.status === "REJECTED" ? "danger" : "warning"} className="text-[9px]">
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

        {/* Right: Sidebar Info */}
        <div className="space-y-6">
          {/* KYC */}
          <Card>
            <CardBody>
              <div className="flex items-center gap-2 mb-3">
                <Shield size={16} className="text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-700">Statut KYC</h3>
              </div>
              <Badge variant={
                kycStatus === "APPROVED" ? "success" :
                kycStatus === "PENDING" ? "warning" :
                kycStatus === "REJECTED" ? "danger" : "neutral"
              }>
                {kycStatus === "NONE" ? "Non soumis" : kycStatus.charAt(0) + kycStatus.slice(1).toLowerCase()}
              </Badge>
              {user.kycDocument?.fullLegalName && (
                <p className="text-xs text-slate-500 mt-2">Nom : {user.kycDocument.fullLegalName}</p>
              )}
            </CardBody>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardBody>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Activité</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Transactions</span>
                  <span className="text-xs font-semibold text-slate-800">{user._count.transactions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Bénéficiaires</span>
                  <span className="text-xs font-semibold text-slate-800">{user._count.beneficiaries}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Notifications</span>
                  <span className="text-xs font-semibold text-slate-800">{user._count.notifications}</span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Cards */}
          <Card>
            <CardBody>
              <div className="flex items-center gap-2 mb-3">
                <CreditCard size={16} className="text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-700">Cartes ({user.cards.length})</h3>
              </div>
              {user.cards.length === 0 ? (
                <p className="text-xs text-slate-400">Aucune carte créée</p>
              ) : (
                <div className="space-y-2">
                  {user.cards.map((card) => (
                    <div key={card.id} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">{card.cardType}</span>
                      <Badge variant={card.status === "ACTIVE" ? "success" : "neutral"} className="text-[10px]">
                        {card.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
