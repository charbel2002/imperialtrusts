"use client";

import { useState } from "react";
import { adminApproveLoan, adminRejectLoan } from "@/actions/loans";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/index";
import { formatCurrency } from "@/lib/utils";
import {
  CheckCircle, XCircle, X, ShieldCheck, ShieldX,
  Banknote, Euro,
} from "lucide-react";

interface Props {
  loanId: string;
  email: string;
  amount: number;
  currency?: string;
  hasAccount: boolean;
  userName?: string;
}

export function AdminLoanActions({ loanId, email, amount, currency = "EUR", hasAccount, userName }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [disburse, setDisburse] = useState(hasAccount);

  if (done) {
    return (
      <Alert variant={done === "approved" ? "success" : "danger"}>
        {done === "approved" ? <CheckCircle size={16} /> : <XCircle size={16} />}
        <span>La demande de prêt a été {done === "approved" ? "approuvée" : "rejetée"}.</span>
      </Alert>
    );
  }

  async function handleApprove() {
    setLoading("approve");
    setError("");
    const result = await adminApproveLoan(loanId, disburse);
    setLoading(null);
    if (result.error) setError(result.error);
    else { setDone("approved"); setShowApprove(false); }
  }

  async function handleReject() {
    if (!rejectReason.trim()) { setError("Motif de rejet requis"); return; }
    setLoading("reject");
    setError("");
    const result = await adminRejectLoan(loanId, rejectReason.trim());
    setLoading(null);
    if (result.error) setError(result.error);
    else { setDone("rejected"); setShowReject(false); }
  }

  // Approve confirmation panel
  if (showApprove) {
    return (
      <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-emerald-800">Approuver le prêt</h4>
          <button onClick={() => setShowApprove(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
        </div>

        {error && <Alert variant="danger" className="!text-xs"><XCircle size={12} className="flex-shrink-0" />{error}</Alert>}

        <div className="p-3 rounded-lg bg-white border border-emerald-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Montant</span>
            <span className="font-bold text-emerald-700">{formatCurrency(amount, currency)}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-slate-600">Demandeur</span>
            <span className="font-medium text-slate-800">{userName ?? email}</span>
          </div>
        </div>

        {/* Disbursement toggle */}
        {hasAccount ? (
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-emerald-200 bg-white hover:bg-emerald-50/50 transition-colors">
            <input
              type="checkbox"
              checked={disburse}
              onChange={(e) => setDisburse(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 mt-0.5"
            />
            <div>
              <p className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                <Banknote size={14} className="text-emerald-600" />
                Verser les fonds sur le compte
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Créditer {formatCurrency(amount, currency)} sur le compte bancaire et créer une transaction LOAN_DISBURSEMENT.
              </p>
            </div>
          </label>
        ) : (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-xs text-amber-700">
              <strong>Aucun compte bancaire trouvé.</strong> Ce demandeur ne possède pas de compte enregistré. Le versement automatique est impossible.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="accent" onClick={handleApprove} loading={loading === "approve"} className="flex-1">
            <ShieldCheck size={14} />
            Approuver{disburse ? " et verser" : ""}
          </Button>
          <Button variant="ghost" onClick={() => setShowApprove(false)}>Annuler</Button>
        </div>
      </div>
    );
  }

  // Reject form
  if (showReject) {
    return (
      <div className="p-4 rounded-xl border border-red-200 bg-red-50/50 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-red-800">Rejeter le prêt — {userName ?? email}</h4>
          <button onClick={() => setShowReject(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
        </div>
        {error && <Alert variant="danger" className="!text-xs"><XCircle size={12} className="flex-shrink-0" />{error}</Alert>}
        <textarea
          placeholder="Expliquez pourquoi la demande de prêt est rejetée..."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-red-200 rounded-lg text-xs resize-none focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 bg-white"
        />
        <div className="flex gap-3">
          <Button variant="danger" onClick={handleReject} loading={loading === "reject"} className="flex-1">
            <ShieldX size={14} /> Rejeter la demande
          </Button>
          <Button variant="ghost" onClick={() => setShowReject(false)}>Annuler</Button>
        </div>
      </div>
    );
  }

  // Default: action buttons
  return (
    <div>
      {error && <Alert variant="danger" className="!text-xs mb-3"><XCircle size={12} className="flex-shrink-0" />{error}</Alert>}
      <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
        <Button variant="accent" size="sm" onClick={() => { setShowApprove(true); setError(""); }}>
          <ShieldCheck size={14} /> Approuver
        </Button>
        <Button variant="ghost" size="sm" onClick={() => { setShowReject(true); setError(""); }} className="text-red-500 hover:bg-red-50 hover:text-red-600">
          <ShieldX size={14} /> Rejeter
        </Button>
      </div>
    </div>
  );
}
