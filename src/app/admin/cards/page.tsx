import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge, Card, CardBody } from "@/components/ui/index";
import { AdminCardActions } from "@/components/admin/admin-card-actions";
import { CreditCard } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cartes" };

export default async function AdminCardsPage() {
  const cards = await prisma.card.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    total: cards.length,
    active: cards.filter((c) => c.status === "ACTIVE").length,
    frozen: cards.filter((c) => c.status === "FROZEN").length,
    cancelled: cards.filter((c) => c.status === "CANCELLED").length,
    totalBalance: cards.reduce((sum, c) => sum + Number(c.balance), 0),
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <CreditCard size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 font-heading">Card Management</h1>
          <p className="text-sm text-slate-500">{stats.total} cards issued</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        {[
          { label: "Total", value: stats.total, color: "text-primary" },
          { label: "Active", value: stats.active, color: "text-emerald-600" },
          { label: "Frozen", value: stats.frozen, color: "text-blue-600" },
          { label: "Cancelled", value: stats.cancelled, color: "text-red-600" },
          { label: "Total Balance", value: formatCurrency(stats.totalBalance), color: "text-primary", isText: true },
        ].map((s) => (
          <Card key={s.label}><div className="px-4 py-3">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{s.label}</p>
            <p className={`text-xl font-bold font-heading ${s.color}`}>
              {(s as any).isText ? s.value : s.value}
            </p>
          </div></Card>
        ))}
      </div>

      {/* Cards Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Card</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expires</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {cards.map((card) => (
                <tr key={card.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-6 rounded flex items-center justify-center text-white text-[8px] font-bold ${card.cardType === "VISA" ? "bg-[#1A1F71]" : "bg-gradient-to-r from-red-500 to-yellow-500"}`}>
                        {card.cardType === "VISA" ? "VISA" : "MC"}
                      </div>
                      <div>
                        <p className="text-sm font-mono text-slate-700">**** {card.cardNumber.slice(-4)}</p>
                        <p className="text-[10px] text-slate-400">{card.cardType}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-800">{card.user.name}</p>
                    <p className="text-xs text-slate-400">{card.user.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-800">{formatCurrency(Number(card.balance))}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={
                      card.status === "ACTIVE" ? "success" :
                      card.status === "FROZEN" ? "info" :
                      card.status === "CANCELLED" ? "danger" : "neutral"
                    }>
                      {card.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">
                      {formatDate(card.expirationDate, "fr", { month: "2-digit", year: "2-digit" })}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-400">
                      {formatDate(card.createdAt, "fr", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <AdminCardActions
                      cardId={card.id}
                      cardStatus={card.status}
                      cardLast4={card.cardNumber.slice(-4)}
                      cardType={card.cardType}
                      userName={card.user.name}
                    />
                  </td>
                </tr>
              ))}
              {cards.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <CreditCard size={40} className="mx-auto mb-3 text-slate-300" />
                    <p className="text-sm">No cards issued yet</p>
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
