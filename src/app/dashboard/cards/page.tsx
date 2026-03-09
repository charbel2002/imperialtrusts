import { getServerSession } from "next-auth";
import { getDictionary } from "@/lib/dictionary";
import { getPlatformSettings } from "@/lib/platform";
import type { Locale } from "@/lib/i18n";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BankCard } from "@/components/dashboard/bank-card";
import { CardActions } from "@/components/dashboard/card-actions";
import { CreateCardModal } from "@/components/dashboard/create-card-modal";
import { Card, CardBody, Badge, Alert } from "@/components/ui/index";
import { CreditCard, AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cards" };

export default async function CardsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const userLang = (session.user.language || "en") as Locale;
  const platform = await getPlatformSettings();
  const dict = await getDictionary(userLang, platform);
  const tc = dict.cards || {};
  const t = dict.dashboardCards;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { account: true, kycDocument: { select: { status: true } }, cards: { orderBy: { createdAt: "desc" } } },
  });
  if (!user) return null;

  const kycSetting = await prisma.systemSetting.findUnique({ where: { key: "kyc_required" } });
  const kycRequired = kycSetting?.value !== "false";
  const canCreateCards = !kycRequired || user.kycDocument?.status === "APPROVED";
  const account = user.account;
  const cards = user.cards;
  const totalCardBalance = cards.reduce((sum, c) => sum + Number(c.balance), 0);
  const activeCards = cards.filter((c) => c.status === "ACTIVE").length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"><CreditCard size={20} className="text-accent" /></div>
          <div><h1 className="text-xl font-bold text-slate-800 font-heading">{t.title}</h1><p className="text-sm text-slate-500">{cards.length} - {activeCards} {dict.common.active.toLowerCase()}</p></div>
        </div>
        {canCreateCards && <CreateCardModal />}
      </div>

      {!canCreateCards && (
        <Alert variant="warning" className="mb-6"><AlertTriangle size={18} className="flex-shrink-0 mt-0.5" /><div><p className="font-medium">{t.kycRequired || "KYC Verification Required"}</p><p className="text-sm mt-0.5">{t.kycRequiredDesc || "Complete identity verification to create cards."}{" "}<Link href="/dashboard/kyc" className="underline font-medium">{dict.dashboard?.verifyNow || "Verify now"} &rarr;</Link></p></div></Alert>
      )}

      {cards.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <Card><CardBody className="!py-3 !px-4"><p className="text-[10px] text-slate-400 uppercase tracking-wider">{dict.common.all}</p><p className="text-xl font-bold text-slate-800 font-heading">{cards.length}</p></CardBody></Card>
          <Card><CardBody className="!py-3 !px-4"><p className="text-[10px] text-slate-400 uppercase tracking-wider">{dict.common.active}</p><p className="text-xl font-bold text-emerald-600 font-heading">{activeCards}</p></CardBody></Card>
          <Card><CardBody className="!py-3 !px-4"><p className="text-[10px] text-slate-400 uppercase tracking-wider">{t.totalBalance}</p><p className="text-xl font-bold text-slate-800 font-heading">{formatCurrency(totalCardBalance, account?.currency)}</p></CardBody></Card>
        </div>
      )}

      {cards.length === 0 ? (
        <Card><CardBody className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center"><CreditCard size={32} className="text-slate-400" /></div>
          <h3 className="text-lg font-semibold text-slate-800 font-heading">{t.noCards}</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">{t.noCardsDesc}</p>
        </CardBody></Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {cards.map((card) => (
            <div key={card.id} className="space-y-4">
              <BankCard cardType={card.cardType} cardNumber={card.cardNumber} holderName={user.name}
                expirationDate={formatDate(card.expirationDate, userLang, { month: "2-digit", year: "2-digit" })}
                balance={Number(card.balance)} currency={account?.currency} status={card.status} size="md" />
              <Card><CardBody className="!py-4">
                <div className="flex items-center justify-between mb-4">
                  <div><p className="text-xs text-slate-400 uppercase tracking-wider">{card.cardType} - **** {card.cardNumber.slice(-4)}</p><p className="text-sm font-semibold text-slate-800 mt-0.5">{formatCurrency(Number(card.balance), account?.currency)}</p></div>
                  <Badge variant={card.status === "ACTIVE" ? "success" : card.status === "FROZEN" ? "info" : card.status === "CANCELLED" ? "danger" : "neutral"}>{card.status}</Badge>
                </div>
                <CardActions cardId={card.id} cardStatus={card.status} cardLast4={card.cardNumber.slice(-4)} cardBalance={Number(card.balance)} accountBalance={Number(account?.balance ?? 0)} cvv={card.cvv} currency={account?.currency ?? "USD"} />
              </CardBody></Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
