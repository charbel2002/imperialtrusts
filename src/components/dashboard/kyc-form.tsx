"use client";

import { useDict } from "@/components/shared/dict-provider";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { submitKyc } from "@/actions/kyc";
import { Input, Textarea, Alert } from "@/components/ui/index";
import { Button } from "@/components/ui/button";
import {
  User, FileText, Camera, CheckCircle, ArrowRight, ArrowLeft,
  Upload, X, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  defaultValues?: {
    fullLegalName: string;
    dateOfBirth: string;
    address: string;
    nationalId: string;
  };
}

export function KycForm({ defaultValues }: Props) {
  const router = useRouter();
  const dict = useDict();
  const tk = (dict.kycPage || {}) as any;
  const tv = (dict.validation || {}) as any;

  const steps = [
    { id: 1, label: tk.step1 || "Personal Info", icon: User },
    { id: 2, label: tk.step2 || "Documents", icon: FileText },
    { id: 3, label: tk.step3 || "Review & Submit", icon: CheckCircle },
  ];

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form fields
  const [fullLegalName, setFullLegalName] = useState(defaultValues?.fullLegalName ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(defaultValues?.dateOfBirth ?? "");
  const [address, setAddress] = useState(defaultValues?.address ?? "");
  const [nationalId, setNationalId] = useState(defaultValues?.nationalId ?? "");

  // File uploads
  const [idDocPath, setIdDocPath] = useState("");
  const [selfiePath, setSelfiePath] = useState("");
  const [idDocName, setIdDocName] = useState("");
  const [selfieName, setSelfieName] = useState("");
  const [uploading, setUploading] = useState<"id" | "selfie" | null>(null);

  // Field validation per step
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validateStep1(): boolean {
    const errors: Record<string, string> = {};
    if (!fullLegalName.trim()) errors.fullLegalName = tv.fullNameRequired || "Full legal name is required";
    if (!dateOfBirth) errors.dateOfBirth = tv.dobRequired || "Date of birth is required";
    if (!address.trim() || address.trim().length < 5) errors.address = (dict.txnProgress?.addressMinLength || "Address must be at least 5 characters");
    if (!nationalId.trim()) errors.nationalId = (dict.txnProgress?.nationalIdRequired || "National ID is required");
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function validateStep2(): boolean {
    const errors: Record<string, string> = {};
    if (!idDocPath) errors.idDoc = tk.idDocRequired || "ID document is required";
    if (!selfiePath) errors.selfie = (dict.txnProgress?.selfieRequired || "Selfie is required");
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function nextStep() {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setFieldErrors({});
    setStep((s) => Math.min(s + 1, 3));
  }

  function prevStep() {
    setFieldErrors({});
    setStep((s) => Math.max(s - 1, 1));
  }

  async function uploadFile(file: File, type: "id_document" | "selfie") {
    setUploading(type === "id_document" ? "id" : "selfie");
    setFieldErrors({});

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setFieldErrors((prev) => ({
          ...prev,
          [type === "id_document" ? "idDoc" : "selfie"]: data.error || (tk.uploadFailed || "Upload failed"),
        }));
        return;
      }

      if (type === "id_document") {
        setIdDocPath(data.path);
        setIdDocName(file.name);
      } else {
        setSelfiePath(data.path);
        setSelfieName(file.name);
      }
    } catch {
      setFieldErrors((prev) => ({
        ...prev,
        [type === "id_document" ? "idDoc" : "selfie"]: tk.uploadFailed || "Upload failed. Please try again.",
      }));
    } finally {
      setUploading(null);
    }
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.set("fullLegalName", fullLegalName);
    formData.set("dateOfBirth", dateOfBirth);
    formData.set("address", address);
    formData.set("nationalId", nationalId);
    formData.set("idDocumentPath", idDocPath);
    formData.set("selfiePath", selfiePath);

    const result = await submitKyc(formData);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
  }

  return (
    <div>
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                step >= s.id ? "bg-primary text-white" : "bg-slate-100 text-slate-400"
              )}>
                {step > s.id ? <CheckCircle size={18} /> : <s.icon size={18} />}
              </div>
              <span className={cn("text-sm font-medium hidden sm:block", step >= s.id ? "text-slate-800" : "text-slate-400")}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn("flex-1 h-px mx-4", step > s.id ? "bg-primary" : "bg-slate-200")} />
            )}
          </div>
        ))}
      </div>

      {error && <Alert variant="danger" className="mb-6"><X size={16} className="flex-shrink-0 mt-0.5" />{error}</Alert>}

      {/* -- STEP 1: Personal Info -- */}
      {step === 1 && (
        <div className="space-y-5">
          <Input
            label={tk.fullName || "Full Legal Name"}
            placeholder={dict.txnProgress?.idPlaceholder || "As it appears on your ID"}
            value={fullLegalName}
            onChange={(e) => setFullLegalName(e.target.value)}
            error={fieldErrors.fullLegalName}
          />
          <Input
            label={tk.dob || "Date of Birth"}
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            error={fieldErrors.dateOfBirth}
          />
          <Textarea
            label={tk.address || "Residential Address"}
            placeholder={tk.addressPlaceholder || "Full address including city, state/province, and postal code"}
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            error={fieldErrors.address}
          />
          <Input
            label={tk.nationalId || "National ID Number"}
            placeholder={tk.nationalIdPlaceholder || "Passport, national ID, or driver's license number"}
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
            error={fieldErrors.nationalId}
          />

          <div className="flex justify-end pt-2">
            <Button onClick={nextStep}>
              {tk.nextDocuments || "Next: Documents"} <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* -- STEP 2: Document Upload -- */}
      {step === 2 && (
        <div className="space-y-6">
          {/* ID Document */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{tk.idDoc || "ID Document"}</label>
            <p className="text-xs text-slate-400 mb-3">{tk.idDocDesc || "Upload a clear photo or scan of your government-issued ID (passport, national ID, or driver's license)."}</p>

            {idDocPath ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <CheckCircle size={20} className="text-emerald-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-emerald-800 truncate">{idDocName}</p>
                  <p className="text-xs text-emerald-600">{tk.uploaded || "Uploaded successfully"}</p>
                </div>
                <button onClick={() => { setIdDocPath(""); setIdDocName(""); }} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className={cn(
                "flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors",
                fieldErrors.idDoc ? "border-red-300 bg-red-50/50" : "border-slate-300 hover:border-secondary hover:bg-blue-50/30"
              )}>
                {uploading === "id" ? (
                  <Loader2 size={32} className="text-secondary animate-spin" />
                ) : (
                  <>
                    <FileText size={32} className="text-slate-400 mb-2" />
                    <p className="text-sm font-medium text-slate-600">{tk.uploadId || "Click to upload ID document"}</p>
                    <p className="text-xs text-slate-400 mt-1">{tk.fileTypes || "JPEG, PNG, WebP, or PDF — Max 5MB"}</p>
                  </>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f, "id_document"); }}
                />
              </label>
            )}
            {fieldErrors.idDoc && <p className="text-xs text-red-500 mt-1">{fieldErrors.idDoc}</p>}
          </div>

          {/* Selfie */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{tk.selfie || "Selfie Verification"}</label>
            <p className="text-xs text-slate-400 mb-3">{tk.selfieDesc || "Take a clear selfie of yourself. Make sure your face is visible and well-lit."}</p>

            {selfiePath ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <CheckCircle size={20} className="text-emerald-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-emerald-800 truncate">{selfieName}</p>
                  <p className="text-xs text-emerald-600">{tk.uploaded || "Uploaded successfully"}</p>
                </div>
                <button onClick={() => { setSelfiePath(""); setSelfieName(""); }} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className={cn(
                "flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors",
                fieldErrors.selfie ? "border-red-300 bg-red-50/50" : "border-slate-300 hover:border-secondary hover:bg-blue-50/30"
              )}>
                {uploading === "selfie" ? (
                  <Loader2 size={32} className="text-secondary animate-spin" />
                ) : (
                  <>
                    <Camera size={32} className="text-slate-400 mb-2" />
                    <p className="text-sm font-medium text-slate-600">{tk.uploadSelfie || "Click to upload selfie"}</p>
                    <p className="text-xs text-slate-400 mt-1">{tk.selfieFileTypes || "JPEG, PNG, or WebP — Max 5MB"}</p>
                  </>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f, "selfie"); }}
                />
              </label>
            )}
            {fieldErrors.selfie && <p className="text-xs text-red-500 mt-1">{fieldErrors.selfie}</p>}
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={prevStep}><ArrowLeft size={16} /> {dict.common?.back || "Back"}</Button>
            <Button onClick={nextStep}>{tk.nextReview || "Next: Review"} <ArrowRight size={16} /></Button>
          </div>
        </div>
      )}

      {/* -- STEP 3: Review & Submit -- */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700">{tk.reviewInfo || "Review Your Information"}</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <ReviewField label={tk.fullName || "Full Legal Name"} value={fullLegalName} />
                <ReviewField label={tk.dob || "Date of Birth"} value={new Date(dateOfBirth + "T00:00:00").toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })} />
                <ReviewField label={tk.nationalId || "National ID"} value={nationalId} />
              </div>
              <ReviewField label={tk.address || "Address"} value={address} />
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                  <FileText size={16} className="text-emerald-600" />
                  <span className="text-sm text-emerald-700 truncate">{idDocName || "ID Document"}</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                  <Camera size={16} className="text-emerald-600" />
                  <span className="text-sm text-emerald-700 truncate">{selfieName || "Selfie"}</span>
                </div>
              </div>
            </div>
          </div>

          <Alert variant="info">
            <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{tk.submitConfirm || "By submitting, you confirm that all information provided is accurate."}</span>
          </Alert>

          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={prevStep}><ArrowLeft size={16} /> {dict.common?.back || "Back"}</Button>
            <Button onClick={handleSubmit} loading={loading} variant="accent" className="shadow-lg shadow-accent/20">
              {tk.submitBtn || "Submit Verification"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}
