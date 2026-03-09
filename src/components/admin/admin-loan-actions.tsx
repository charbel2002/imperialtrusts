"use client";

import { useState } from "react";
import { adminApproveLoan, adminRejectLoan } from "@/actions/loans";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/index";
import { formatCurrency } from "@/lib/utils";
import {
  CheckCircle, XCircle, X, ShieldCheck, ShieldX,
  Banknote, DollarSign,
} from "lucide-react";

interface Props {
  loanId: string;
  email: string;
  amount: number;
  hasAccount: boolean;
  userName?: string;
}

export function AdminLoanActions({ loanId, email, amount, hasAccount, userName }: Props) {
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
        <span>Loan application has been {done}.</span>
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
    if (!rejectReason.trim()) { setError("Rejection reason required"); return; }
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
          <h4 className="text-sm font-semibold text-emerald-800">Approve Loan</h4>
          <button onClick={() => setShowApprove(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
        </div>

        {error && <Alert variant="danger" className="!text-xs"><XCircle size={12} className="flex-shrink-0" />{error}</Alert>}

        <div className="p-3 rounded-lg bg-white border border-emerald-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Amount</span>
            <span className="font-bold text-emerald-700">{formatCurrency(amount)}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-slate-600">Applicant</span>
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
                Disburse funds to account
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Credit {formatCurrency(amount)} to the user&apos;s bank account and create a LOAN_DISBURSEMENT transaction.
              </p>
            </div>
          </label>
        ) : (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-xs text-amber-700">
              <strong>No bank account found.</strong> This applicant does not have a registered account. Funds cannot be disbursed automatically.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="accent" onClick={handleApprove} loading={loading === "approve"} className="flex-1">
            <ShieldCheck size={14} />
            Approve{disburse ? " & Disburse" : ""}
          </Button>
          <Button variant="ghost" onClick={() => setShowApprove(false)}>Cancel</Button>
        </div>
      </div>
    );
  }

  // Reject form
  if (showReject) {
    return (
      <div className="p-4 rounded-xl border border-red-200 bg-red-50/50 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-red-800">Reject Loan - {userName ?? email}</h4>
          <button onClick={() => setShowReject(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
        </div>
        {error && <Alert variant="danger" className="!text-xs"><XCircle size={12} className="flex-shrink-0" />{error}</Alert>}
        <textarea
          placeholder="Explain why the loan application is being rejected..."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-red-200 rounded-lg text-xs resize-none focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 bg-white"
        />
        <div className="flex gap-3">
          <Button variant="danger" onClick={handleReject} loading={loading === "reject"} className="flex-1">
            <ShieldX size={14} /> Reject Application
          </Button>
          <Button variant="ghost" onClick={() => setShowReject(false)}>Cancel</Button>
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
          <ShieldCheck size={14} /> Approve
        </Button>
        <Button variant="ghost" size="sm" onClick={() => { setShowReject(true); setError(""); }} className="text-red-500 hover:bg-red-50 hover:text-red-600">
          <ShieldX size={14} /> Reject
        </Button>
      </div>
    </div>
  );
}
