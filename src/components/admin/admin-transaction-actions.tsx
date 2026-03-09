"use client";

import { useState } from "react";
import {
  adminApproveTransaction,
  adminRejectTransaction,
  adminAddTransactionLock,
} from "@/actions/transactions";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle, XCircle, Lock, X, ShieldCheck, ShieldX } from "lucide-react";

interface Props {
  transactionId: string;
  status: string;
  reference: string;
  userName: string;
  amount: number;
  currency: string;
  maxLockPercentage?: number;
}

export function AdminTransactionActions({ transactionId, status, reference, userName, amount, currency, maxLockPercentage = 0 }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showLock, setShowLock] = useState(false);
  const [lockMotif, setLockMotif] = useState("");
  const [lockCode, setLockCode] = useState("");
  const [lockPercentage, setLockPercentage] = useState(Math.max(maxLockPercentage + 5, 5));

  const canApprove = status === "PENDING";
  const canReject = ["PENDING", "PROCESSING"].includes(status);
  const canLock = ["PENDING", "INITIALIZED", "PROCESSING"].includes(status);
  const showActions = canApprove || canReject || canLock;

  if (!showActions && !done) return <span className="text-xs text-slate-400">-</span>;
  if (done) {
    return (
      <span className={`text-xs font-medium ${done === "approved" ? "text-emerald-600" : done === "rejected" ? "text-red-500" : "text-amber-600"}`}>
        {done === "approved" ? "Approved" : done === "rejected" ? "Rejected" : "Lock Added"}
      </span>
    );
  }

  async function handleApprove() {
    if (!confirm(`Approve transfer of ${formatCurrency(amount, currency)} for ${userName}?`)) return;
    setLoading("approve"); setError("");
    const r = await adminApproveTransaction(transactionId);
    setLoading(null);
    if (r.error) setError(r.error); else setDone("approved");
  }

  async function handleReject() {
    if (!rejectReason.trim()) { setError("Reason required"); return; }
    setLoading("reject"); setError("");
    const r = await adminRejectTransaction(transactionId, rejectReason.trim());
    setLoading(null);
    if (r.error) setError(r.error); else { setDone("rejected"); setShowReject(false); }
  }

  async function handleAddLock() {
    if (!lockMotif.trim() || !lockCode.trim()) { setError("Motif and code required"); return; }
    setLoading("lock"); setError("");
    const r = await adminAddTransactionLock({ transactionId, motif: lockMotif.trim(), securityCode: lockCode.trim(), percentage: lockPercentage });
    setLoading(null);
    if (r.error) setError(r.error); else { setDone("locked"); setShowLock(false); }
  }

  if (showReject) {
    return (
      <div className="min-w-[260px] p-3 rounded-xl border border-slate-200 bg-white shadow-lg space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">Reject {reference}</span>
          <button onClick={() => setShowReject(false)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
        </div>
        {error && <p className="text-[10px] text-red-500">{error}</p>}
        <textarea placeholder="Rejection reason..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={2}
          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs resize-none focus:outline-none focus:ring-1 focus:ring-secondary/30" />
        <Button size="sm" variant="danger" onClick={handleReject} loading={loading === "reject"} className="w-full !text-xs">
          <ShieldX size={12} /> Reject
        </Button>
      </div>
    );
  }

  if (showLock) {
    return (
      <div className="min-w-[280px] p-3 rounded-xl border border-slate-200 bg-white shadow-lg space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">Add Lock to {reference}</span>
          <button onClick={() => setShowLock(false)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
        </div>
        {error && <p className="text-[10px] text-red-500">{error}</p>}
        <input placeholder="Motif / Reason..." value={lockMotif} onChange={(e) => setLockMotif(e.target.value)}
          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-secondary/30" />
        <input placeholder="Security code (e.g. TX-8294)" value={lockCode} onChange={(e) => setLockCode(e.target.value)}
          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-secondary/30" />
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] text-slate-500">Checkpoint at</label>
            <span className="text-xs font-bold text-secondary">{lockPercentage}%</span>
          </div>
          <input type="range" min={Math.max(maxLockPercentage + 5, 5)} max={95} step={5} value={lockPercentage} onChange={(e) => setLockPercentage(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ background: `linear-gradient(to right, #1E40AF ${((lockPercentage - 5) / 90) * 100}%, #e2e8f0 ${((lockPercentage - 5) / 90) * 100}%)` }} />
          <div className="flex justify-between text-[9px] text-slate-400 mt-0.5"><span>{Math.max(maxLockPercentage + 5, 5)}%</span><span>95%</span></div>
        </div>
        <Button size="sm" variant="secondary" onClick={handleAddLock} loading={loading === "lock"} className="w-full !text-xs">
          <Lock size={12} /> Add Lock at {lockPercentage}%
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {error && <span className="text-[9px] text-red-500 mr-1">{error}</span>}
      {canApprove && (
        <Button size="sm" variant="ghost" onClick={handleApprove} loading={loading === "approve"} className="text-emerald-600 hover:bg-emerald-50 !px-2" title="Approve">
          <ShieldCheck size={14} />
        </Button>
      )}
      {canReject && (
        <Button size="sm" variant="ghost" onClick={() => { setShowReject(true); setError(""); }} className="text-red-500 hover:bg-red-50 !px-2" title="Reject">
          <ShieldX size={14} />
        </Button>
      )}
      {canLock && (
        <Button size="sm" variant="ghost" onClick={() => { setShowLock(true); setError(""); }} className="text-amber-600 hover:bg-amber-50 !px-2" title="Add Lock">
          <Lock size={14} />
        </Button>
      )}
    </div>
  );
}
