import { formatDate } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { Badge, Card } from "@/components/ui/index";
import { KycReviewActions } from "@/components/admin/kyc-review-actions";
import { Shield, User, Calendar, FileText, Camera } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Vérification KYC" };

export default async function AdminKycPage() {
  const submissions = await prisma.kycDocument.findMany({
    include: {
      user: {
        select: { id: true, name: true, email: true, language: true, createdAt: true, account: { select: { id: true, currency: true } } },
      },
    },
    orderBy: [
      { status: "asc" }, // PENDING first
      { createdAt: "desc" },
    ],
  });

  const pending = submissions.filter((s) => s.status === "PENDING");
  const reviewed = submissions.filter((s) => s.status !== "PENDING");

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Shield size={20} className="text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 font-heading">Vérification KYC</h1>
            <p className="text-sm text-slate-500">{pending.length} en attente de révision</p>
          </div>
        </div>
      </div>

      {/* Pending Queue */}
      {pending.length > 0 && (
        <div className="mb-10">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
            En attente de révision ({pending.length})
          </h2>
          <div className="space-y-4">
            {pending.map((kyc) => (
              <KycSubmissionCard key={kyc.id} kyc={kyc} />
            ))}
          </div>
        </div>
      )}

      {pending.length === 0 && (
        <Card className="mb-10">
          <div className="px-6 py-12 text-center">
            <Shield size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm text-slate-500">Aucune soumission KYC en attente</p>
          </div>
        </Card>
      )}

      {/* Reviewed History */}
      {reviewed.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
            Historique des révisions ({reviewed.length})
          </h2>
          <div className="space-y-4">
            {reviewed.map((kyc) => (
              <KycSubmissionCard key={kyc.id} kyc={kyc} showActions={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KycSubmissionCard({ kyc, showActions = true }: {
  kyc: any;
  showActions?: boolean;
}) {
  const statusVariant = kyc.status === "APPROVED" ? "success" : kyc.status === "REJECTED" ? "danger" : "warning";
  const isPending = kyc.status === "PENDING";

  return (
    <Card>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
              {kyc.user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">{kyc.user.name}</h3>
              <p className="text-sm text-slate-500">{kyc.user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={statusVariant}>
              {kyc.status.charAt(0) + kyc.status.slice(1).toLowerCase()}
            </Badge>
            <span className="text-xs text-slate-400">
              {formatDate(kyc.createdAt, "fr", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <DetailItem icon={User} label="Nom légal" value={kyc.fullLegalName} />
          <DetailItem icon={Calendar} label="Date de naissance" value={formatDate(kyc.dateOfBirth, "fr", { year: "numeric", month: "short", day: "numeric" })} />
          <DetailItem icon={FileText} label="Pièce d&apos;identité" value={kyc.nationalId} />
          <DetailItem icon={User} label="Adresse" value={kyc.address.substring(0, 40) + (kyc.address.length > 40 ? "..." : "")} />
        </div>

        {/* Documents */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <DocViewer label="Pièce d&apos;identité" path={kyc.idDocumentPath} icon={FileText} />
          <DocViewer label="Photo selfie" path={kyc.selfiePath} icon={Camera} />
        </div>

        {/* Rejection reason if rejected */}
        {kyc.status === "REJECTED" && kyc.rejectionReason && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 mb-4">
            <p className="text-xs font-medium text-red-700">Motif de rejet</p>
            <p className="text-sm text-red-600 mt-0.5">{kyc.rejectionReason}</p>
          </div>
        )}

        {/* Actions */}
        {isPending && showActions && (
          <KycReviewActions
            kycId={kyc.id}
            userName={kyc.user.name}
            userId={kyc.user.id}
            userLanguage={kyc.user.language || "en"}
            accountId={kyc.user.account?.id}
            accountCurrency={kyc.user.account?.currency}
          />
        )}
      </div>
    </Card>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function DocViewer({ label, path, icon: Icon }: { label: string; path: string; icon: any }) {
  const isPdf = path.endsWith(".pdf");
  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
        <Icon size={14} className="text-slate-500" />
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <a href={path} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs text-secondary hover:underline">
          Ouvrir
        </a>
      </div>
      <div className="h-40 flex items-center justify-center bg-slate-50/50 p-2">
        {isPdf ? (
          <div className="text-center">
            <div className="w-12 h-14 mx-auto rounded bg-red-100 flex items-center justify-center text-red-500 text-xs font-bold">PDF</div>
            <p className="text-xs text-slate-400 mt-2">Cliquez sur &quot;Ouvrir&quot; pour voir</p>
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={path} alt={label} className="max-h-full max-w-full object-contain rounded" />
        )}
      </div>
    </div>
  );
}
