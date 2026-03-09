import { getServerSession } from "next-auth";
import { getDictionary } from "@/lib/dictionary";
import { getPlatformSettings } from "@/lib/platform";
import type { Locale } from "@/lib/i18n";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BeneficiaryCard } from "@/components/dashboard/beneficiary-card";
import { AddBeneficiaryButton } from "@/components/dashboard/add-beneficiary-button";
import { Card, CardBody, Alert } from "@/components/ui/index";
import { Users, AlertTriangle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Beneficiaries" };

export default async function BeneficiariesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const userLang = (session.user.language || "en") as Locale;
  const platform = await getPlatformSettings();
  const dict = await getDictionary(userLang, platform);
  const t = dict.dashboardBeneficiaries;

  const kycSetting = await prisma.systemSetting.findUnique({ where: { key: "kyc_required" } });
  const kycRequired = kycSetting?.value !== "false";
  let canManage = true;
  if (kycRequired) { const kyc = await prisma.kycDocument.findUnique({ where: { userId: session.user.id } }); canManage = kyc?.status === "APPROVED"; }

  const beneficiaries = await prisma.beneficiary.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, include: { _count: { select: { transactions: true } } } });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"><Users size={20} className="text-accent" /></div>
          <div><h1 className="text-xl font-bold text-slate-800 font-heading">{t.title}</h1><p className="text-sm text-slate-500">{beneficiaries.length} {t.subtitle.split("{{count}}")[1]?.replace("{{count}}", "") || ""}</p></div>
        </div>
        {canManage && <AddBeneficiaryButton />}
      </div>
      {!canManage && (<Alert variant="warning" className="mb-6"><AlertTriangle size={18} className="flex-shrink-0 mt-0.5" /><div><p className="font-medium">{dict.dashboard.kycRequired}</p></div></Alert>)}
      {beneficiaries.length === 0 && canManage && (
        <Card><CardBody className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center"><Users size={32} className="text-slate-400" /></div>
          <h3 className="text-lg font-semibold text-slate-800 font-heading">{t.noBeneficiaries}</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">{t.noBeneficiariesDesc}</p>
          <div className="mt-6"><AddBeneficiaryButton /></div>
        </CardBody></Card>
      )}
      {beneficiaries.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {beneficiaries.map((b) => (<BeneficiaryCard key={b.id} beneficiary={{ id: b.id, name: b.name, bankName: b.bankName, accountNumber: b.accountNumber, swift: b.swift, country: b.country }} />))}
        </div>
      )}
    </div>
  );
}
