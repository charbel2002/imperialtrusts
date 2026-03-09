import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Badge, Card } from "@/components/ui/index";
import { Users, Search, Eye } from "lucide-react";
import { UserSearchFilter } from "@/components/admin/user-search-filter";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Utilisateurs" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string };
}) {
  const query = searchParams.q || "";
  const statusFilter = searchParams.status || "all";

  const where: any = {};

  if (query) {
    where.OR = [
      { name: { contains: query } },
      { email: { contains: query } },
      { account: { accountNumber: { contains: query } } },
    ];
  }

  if (statusFilter === "active") where.account = { ...where.account, status: "ACTIVE" };
  else if (statusFilter === "locked") where.account = { ...where.account, status: "LOCKED" };
  else if (statusFilter === "suspended") where.account = { ...where.account, status: "SUSPENDED" };

  const users = await prisma.user.findMany({
    where,
    include: {
      account: true,
      kycDocument: { select: { status: true } },
      _count: { select: { transactions: true, cards: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => u.account?.status === "ACTIVE").length,
    locked: users.filter((u) => u.account?.status === "LOCKED").length,
    suspended: users.filter((u) => u.account?.status === "SUSPENDED").length,
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <Users size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 font-heading">User Management</h1>
          <p className="text-sm text-slate-500">{stats.total} users total</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Users", value: stats.total, color: "text-primary" },
          { label: "Active", value: stats.active, color: "text-emerald-600" },
          { label: "Locked", value: stats.locked, color: "text-red-600" },
          { label: "Suspended", value: stats.suspended, color: "text-amber-600" },
        ].map((s) => (
          <Card key={s.label}>
            <div className="px-4 py-3">
              <p className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</p>
              <p className={`text-2xl font-bold font-heading ${s.color}`}>{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Search & Filter */}
      <UserSearchFilter currentQuery={query} currentStatus={statusFilter} />

      {/* Users Table */}
      <Card className="mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Account</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">KYC</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Activity</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((user) => {
                const kycStatus = user.kycDocument?.status ?? "NONE";
                return (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{user.name}</p>
                          <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-mono text-slate-700">{user.account?.accountNumber ?? "-"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-800">
                        {user.account ? formatCurrency(Number(user.account.balance), user.account.currency) : "-"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={
                        user.account?.status === "ACTIVE" ? "success" :
                        user.account?.status === "LOCKED" ? "danger" : "warning"
                      }>
                        {user.account?.status ?? "N/A"}
                      </Badge>
                      {!user.isActive && <Badge variant="danger" className="ml-1">Disabled</Badge>}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={
                        kycStatus === "APPROVED" ? "success" :
                        kycStatus === "PENDING" ? "warning" :
                        kycStatus === "REJECTED" ? "danger" : "neutral"
                      }>
                        {kycStatus === "NONE" ? "None" : kycStatus.charAt(0) + kycStatus.slice(1).toLowerCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-500">
                        <span>{user._count.transactions} txns</span>
                        <span className="mx-1">-</span>
                        <span>{user._count.cards} cards</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-secondary hover:bg-blue-50 transition-colors"
                      >
                        <Eye size={14} /> View
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <Users size={40} className="mx-auto mb-3 text-slate-300" />
                    <p className="text-sm">No users found</p>
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
