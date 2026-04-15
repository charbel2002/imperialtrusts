"use client";

import { useState } from "react";
import { approveKyc, rejectKyc } from "@/actions/kyc";
import { updateUserLanguage, setAccountCurrency } from "@/actions/accounts";
import { Button } from "@/components/ui/button";
import { Textarea, Alert } from "@/components/ui/index";
import { CheckCircle, XCircle, X, Globe, Banknote } from "lucide-react";
import { SUPPORTED_CURRENCIES, type SupportedCurrency } from "@/lib/currencies";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "it", label: "Italiano" },
  { code: "sk", label: "Slovenčina" },
  { code: "cz", label: "Čeština" },
  { code: "ro", label: "Română" },
  { code: "hi", label: "हिन्दी" },
  { code: "fi", label: "Suomi" },
  { code: "el", label: "Ελληνικά" },
  { code: "hu", label: "Magyar" },
];

interface Props {
  kycId: string;
  userName: string;
  userId: string;
  userLanguage: string;
  accountId?: string;
  accountCurrency?: string;
}

export function KycReviewActions({ kycId, userName, userId, userLanguage, accountId, accountCurrency }: Props) {
  const [showReject, setShowReject] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);

  const [language, setLanguage] = useState(userLanguage || "en");
  const [currency, setCurrency] = useState<SupportedCurrency>((accountCurrency as SupportedCurrency) || "EUR");
  const [langSaved, setLangSaved] = useState(false);
  const [currSaved, setCurrSaved] = useState(false);

  async function handleLangChange(newLang: string) {
    setLanguage(newLang);
    setLangSaved(false);
    const result = await updateUserLanguage(userId, newLang);
    if (!result.error) setLangSaved(true);
  }

  async function handleCurrencyChange(newCurrency: SupportedCurrency) {
    if (!accountId) return;
    setCurrency(newCurrency);
    setCurrSaved(false);
    const result = await setAccountCurrency(accountId, newCurrency);
    if (!result.error) setCurrSaved(true);
  }

  async function handleApprove() {
    setLoading("approve");
    setError("");
    const result = await approveKyc(kycId);
    setLoading(null);
    if (result.error) setError(result.error);
    else setDone("approved");
  }

  async function handleReject() {
    if (!rejectionReason.trim() || rejectionReason.trim().length < 5) {
      setError("Veuillez fournir un motif de rejet (min. 5 caractères)");
      return;
    }
    setLoading("reject");
    setError("");
    const result = await rejectKyc(kycId, rejectionReason.trim());
    setLoading(null);
    if (result.error) setError(result.error);
    else setDone("rejected");
  }

  if (done) {
    return (
      <Alert variant={done === "approved" ? "success" : "danger"}>
        {done === "approved" ? <CheckCircle size={18} /> : <XCircle size={18} />}
        <span>
          Le KYC de <strong>{userName}</strong> a été {done === "approved" ? "approuvé" : "rejeté"}.
        </span>
      </Alert>
    );
  }

  return (
    <div>
      {error && (
        <Alert variant="danger" className="mb-4">
          <XCircle size={16} className="flex-shrink-0" />{error}
        </Alert>
      )}

      {showReject ? (
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700">Rejeter le KYC de {userName}</h4>
            <button onClick={() => { setShowReject(false); setError(""); }} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>
          <Textarea
            label="Motif de rejet"
            placeholder="Expliquez pourquoi la vérification a été rejetée afin que l'utilisateur puisse soumettre à nouveau..."
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
          <div className="flex gap-3">
            <Button variant="danger" onClick={handleReject} loading={loading === "reject"} size="sm">
              Confirmer le rejet
            </Button>
            <Button variant="ghost" onClick={() => setShowReject(false)} size="sm">Annuler</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 pt-4 border-t border-slate-100">
          {/* Language & Currency selectors */}
          <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
            {/* Language */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Globe size={14} className="text-slate-400" />
                <label className="text-xs font-semibold text-slate-600">Langue de l&apos;utilisateur</label>
                {langSaved && <span className="text-[10px] text-emerald-600 ml-auto">✓ Enregistré</span>}
              </div>
              <select
                value={language}
                onChange={(e) => handleLangChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>

            {/* Currency */}
            {accountId && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Banknote size={14} className="text-slate-400" />
                  <label className="text-xs font-semibold text-slate-600">Devise du compte</label>
                  {currSaved && <span className="text-[10px] text-emerald-600 ml-auto">✓ Enregistré</span>}
                </div>
                <div className="flex gap-2">
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleCurrencyChange(c)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        c === currency
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Approve / Reject */}
          <div className="flex items-center gap-3">
            <Button variant="accent" onClick={handleApprove} loading={loading === "approve"} size="sm">
              <CheckCircle size={16} /> Approuver
            </Button>
            <Button variant="ghost" onClick={() => setShowReject(true)} size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
              <XCircle size={16} /> Rejeter
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
