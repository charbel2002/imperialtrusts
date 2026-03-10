import { getServerSession } from "next-auth";
import { getDictionary } from "@/lib/dictionary";
import { formatDate } from "@/lib/utils";
import { getPlatformSettings } from "@/lib/platform";
import type { Locale } from "@/lib/i18n";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KycForm } from "@/components/dashboard/kyc-form";
import { Card, CardBody, Badge, Alert } from "@/components/ui/index";
import { Shield, CheckCircle, XCircle, Clock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "KYC Verification" };

export default async function KycPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const userLang = (session.user.language || "en") as Locale;
  const platform = await getPlatformSettings();
  const dict = await getDictionary(userLang, platform);
  const tk = dict.kycPage || {} as any;
  const tc = dict.common || {} as any;

  const kyc = await prisma.kycDocument.findUnique({
    where: { userId: session.user.id },
  });

  const kycSetting = await prisma.systemSetting.findUnique({
    where: { key: "kyc_required" },
  });
  const kycRequired = kycSetting?.value !== "false";

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Shield size={20} className="text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 font-heading">{tk.title || "KYC Verification"}</h1>
            <p className="text-sm text-slate-500">{tk.subtitle || "Verify your identity to unlock all banking features"}</p>
          </div>
        </div>
      </div>

      {!kycRequired && (
        <Alert variant="info" className="mb-6">
          <Shield size={18} className="flex-shrink-0 mt-0.5" />
          <span>{tk.optionalNotice || "KYC verification is currently optional. All features are accessible without verification."}</span>
        </Alert>
      )}

      {/* -- APPROVED -- */}
      {kyc?.status === "APPROVED" && (
        <Card>
          <CardBody>
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 font-heading">{tk.verifiedTitle || "Identity Verified"}</h2>
              <p className="mt-2 text-sm text-slate-500">{tk.verifiedDesc || "Your KYC verification has been approved. You have full access to all features."}</p>
              <Badge variant="success" className="mt-4">{tc.verified || "Verified"}</Badge>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">{tk.verifiedInfo || "Verified Information"}</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <InfoRow label={tk.fullName || "Full Legal Name"} value={kyc.fullLegalName} />
                <InfoRow label={tk.dob || "Date of Birth"} value={formatDate(kyc.dateOfBirth, userLang)} />
                <InfoRow label={tk.nationalId || "National ID"} value={kyc.nationalId} />
                <InfoRow label={tk.verifiedOn || "Verified On"} value={kyc.reviewedAt ? formatDate(kyc.reviewedAt, userLang) : "-"} />
              </div>
              <div className="mt-4"><InfoRow label={tk.address || "Address"} value={kyc.address} /></div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* -- PENDING -- */}
      {kyc?.status === "PENDING" && (
        <Card>
          <CardBody>
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <Clock size={32} className="text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 font-heading">{tk.reviewTitle || "Under Review"}</h2>
              <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">{tk.reviewDesc || "Your documents have been submitted and are being reviewed. This usually takes less than 24 hours."}</p>
              <Badge variant="warning" className="mt-4">{tk.pendingReview || "Pending Review"}</Badge>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">{tk.submittedInfo || "Submitted Information"}</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <InfoRow label={tk.fullName || "Full Legal Name"} value={kyc.fullLegalName} />
                <InfoRow label={tk.dob || "Date of Birth"} value={formatDate(kyc.dateOfBirth, userLang)} />
                <InfoRow label={tk.nationalId || "National ID"} value={kyc.nationalId} />
                <InfoRow label={tk.submitted || "Submitted"} value={formatDate(kyc.createdAt, userLang)} />
              </div>
              <div className="mt-4 grid sm:grid-cols-2 gap-4">
                <DocPreview label={tk.idDoc || "ID Document"} path={kyc.idDocumentPath} />
                <DocPreview label={tk.selfie || "Selfie"} path={kyc.selfiePath} />
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* -- REJECTED -- */}
      {kyc?.status === "REJECTED" && (
        <div className="space-y-6">
          <Alert variant="danger">
            <XCircle size={20} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{tk.rejectedTitle || "Verification Rejected"}</p>
              <p className="text-sm mt-0.5">{(tk.rejectedReason || "Reason: {{reason}}").replace("{{reason}}", kyc.rejectionReason || (tk.noReason || "No reason provided"))}</p>
            </div>
          </Alert>
          <Card><CardBody>
            <div className="text-center py-4 mb-6">
              <h2 className="text-lg font-bold text-slate-800 font-heading">{tk.resubmitTitle || "Resubmit Your Documents"}</h2>
              <p className="mt-1 text-sm text-slate-500">{tk.resubmitDesc || "Please review the rejection reason and submit updated information."}</p>
            </div>
            <KycForm defaultValues={{ fullLegalName: kyc.fullLegalName, dateOfBirth: new Date(kyc.dateOfBirth).toISOString().split("T")[0], address: kyc.address, nationalId: kyc.nationalId }} />
          </CardBody></Card>
        </div>
      )}

      {/* -- NOT SUBMITTED -- */}
      {!kyc && (
        <Card><CardBody>
          <div className="text-center py-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <Shield size={32} className="text-secondary" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 font-heading">{tk.verifyTitle || "Verify Your Identity"}</h2>
            <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">{tk.verifyDesc || "Complete KYC verification to unlock fund transfers, virtual cards, and beneficiary management."}</p>
          </div>
          <div className="mb-8 p-4 bg-slate-50 rounded-xl">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">{tk.whatYouNeed || "What you'll need:"}</h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {[tk.need1 || "Government-issued photo ID", tk.need2 || "A clear selfie of yourself", tk.need3 || "Your full legal name", tk.need4 || "Current residential address"].map((item: string) => (
                <div key={item} className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle size={14} className="text-accent flex-shrink-0" />{item}
                </div>
              ))}
            </div>
          </div>
          <KycForm />
        </CardBody></Card>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

function DocPreview({ label, path }: { label: string; path: string }) {
  const isPdf = path.endsWith(".pdf");
  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-200"><p className="text-xs font-medium text-slate-600">{label}</p></div>
      <div className="p-3 h-32 flex items-center justify-center bg-slate-50/50">
        {isPdf ? (
          <div className="text-center"><div className="w-10 h-12 mx-auto mb-1 rounded bg-red-100 flex items-center justify-center text-red-500 text-xs font-bold">PDF</div><p className="text-xs text-slate-400">Document uploaded</p></div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={path} alt={label} className="max-h-full max-w-full object-contain rounded" />
        )}
      </div>
    </div>
  );
}
