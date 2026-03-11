import { getServerSession } from "next-auth";
import { getDictionary } from "@/lib/dictionary";
import { getPlatformSettings } from "@/lib/platform";
import type { Locale } from "@/lib/i18n";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { TransferForm } from "@/components/dashboard/transfer-form";
import { Card, CardBody, Alert } from "@/components/ui/index";
import { Send, AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Send Money" };

export default async function TransfersPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const userLang = (session.user.language || "en") as Locale;
  const platform = await getPlatformSettings();
  const dict = await getDictionary(userLang, platform);
  const t = dict.transfersPage || {};

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, include: { account: true, kycDocument: true } });
  const kycSetting = await prisma.systemSetting.findUnique({ where: { key: "kyc_required" } });
  const kycRequired = kycSetting?.value !== "false";
  const canTransfer = !kycRequired || user?.kycDocument?.status === "APPROVED";
  const accountActive = user?.account?.status === "ACTIVE";
  const beneficiaries = await prisma.beneficiary.findMany({ where: { userId: session.user.id }, orderBy: { name: "asc" } });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"><Send size={20} className="text-accent" /></div>
        <div><h1 className="text-xl font-bold text-slate-800 font-heading">{t.title}</h1><p className="text-sm text-slate-500">{t.subtitle}</p></div>
      </div>
      {!canTransfer && (<Alert variant="warning" className="mb-6"><AlertTriangle size={18} className="flex-shrink-0 mt-0.5" /><div><p className="font-medium">{dict.dashboard.kycRequired}</p><p className="text-sm mt-0.5"><Link href={`/dashboard/kyc`} className="underline font-medium">{dict.dashboard.verifyNow} &rarr;</Link></p></div></Alert>)}
      {canTransfer && !accountActive && (<Alert variant="danger" className="mb-6"><AlertTriangle size={18} className="flex-shrink-0 mt-0.5" /><span>{dict.dashboard.accountLockedMsg}</span></Alert>)}
      {canTransfer && accountActive && (
        <Card><CardBody>
          <div className="p-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white mb-6">
            <p className="text-xs text-white/60 uppercase tracking-wider">{dict.dashboard.balance}</p>
            <p className="text-2xl font-bold font-heading mt-0.5">{formatCurrency(Number(user?.account?.balance ?? 0), user?.account?.currency)}</p>
          </div>
          {beneficiaries.length === 0 ? (
            <div className="text-center py-8"><p className="text-sm text-slate-500 mb-4">{t.noBeneficiaries}</p>
            <Link href={`/dashboard/beneficiaries`} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-medium">{t.addBeneficiary}</Link></div>
          ) : (<TransferForm beneficiaries={beneficiaries.map((b) => ({ id: b.id, name: b.name, bankName: b.bankName, accountNumber: b.accountNumber, country: b.country }))} maxAmount={Number(user?.account?.balance ?? 0)} currency={user?.account?.currency ?? "EUR"} />)}
        </CardBody></Card>
      )}
    </div>
  );
}
