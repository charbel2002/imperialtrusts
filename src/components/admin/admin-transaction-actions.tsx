"use client";

import { useState, useRef } from "react";
import {
  adminApproveTransaction,
  adminRejectTransaction,
  adminAddTransactionLock,
} from "@/actions/transactions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/index";
import { formatCurrency } from "@/lib/utils";
import {
  CheckCircle, XCircle, Lock, X, ShieldCheck, ShieldX,
  Copy, Check, ChevronDown, ChevronUp, AlertTriangle,
} from "lucide-react";

interface LockData {
  id: string;
  motif: string;
  securityCode: string;
  percentage: number;
  isResolved: boolean;
  createdAt: Date;
}

interface Props {
  transactionId: string;
  status: string;
  reference: string;
  userName: string;
  amount: number;
  currency: string;
  currentProgress?: number;
  locks?: LockData[];
}

export function AdminTransactionActions({
  transactionId,
  status: initialStatus,
  reference,
  userName,
  amount,
  currency,
  currentProgress = 0,
  locks: initialLocks = [],
}: Props) {
  // ── Local state for action-chaining ──────────────────────
  const [status, setStatus] = useState(initialStatus);
  const [locks, setLocks] = useState<LockData[]>(initialLocks);

  const maxLockPercentage = locks.length > 0 ? Math.max(...locks.map((l) => l.percentage)) : 0;
  const lockFloor = Math.max(maxLockPercentage, currentProgress);

  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Action panels
  const [panel, setPanel] = useState<"actions" | "reject" | "lock">("actions");
  const [rejectReason, setRejectReason] = useState("");
  const [lockMotif, setLockMotif] = useState("");
  const [lockCode, setLockCode] = useState("");
  const [lockPercentage, setLockPercentage] = useState(Math.min(lockFloor + 1, 99));

  // Lock list toggle
  const [showLocks, setShowLocks] = useState(false);

  // Copy state for security codes
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimeout = useRef<ReturnType<typeof setTimeout>>();

  // ── Permissions (derived from local status) ──────────────
  const canApprove = status === "PENDING";
  const canReject = ["PENDING", "PROCESSING"].includes(status);
  const canLock = ["PENDING", "INITIALIZED", "PROCESSING"].includes(status);
  const isTerminal = ["COMPLETED", "REJECTED", "CANCELLED"].includes(status);

  // ── Handlers ─────────────────────────────────────────────
  async function handleApprove() {
    if (!confirm(`Approuver le virement de ${formatCurrency(amount, currency)} pour ${userName} ?`)) return;
    setLoading("approve");
    setError("");
    const r = await adminApproveTransaction(transactionId);
    setLoading(null);
    if (r.error) {
      setError(r.error);
    } else {
      // Approved → PROCESSING if has locks, COMPLETED otherwise
      setStatus(locks.length > 0 ? "PROCESSING" : "COMPLETED");
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) { setError("Motif requis"); return; }
    setLoading("reject");
    setError("");
    const r = await adminRejectTransaction(transactionId, rejectReason.trim());
    setLoading(null);
    if (r.error) {
      setError(r.error);
    } else {
      setStatus("REJECTED");
      setPanel("actions");
      setRejectReason("");
    }
  }

  async function handleAddLock() {
    if (!lockMotif.trim() || !lockCode.trim()) { setError("Motif et code requis"); return; }
    setLoading("lock");
    setError("");
    const r = await adminAddTransactionLock({
      transactionId,
      motif: lockMotif.trim(),
      securityCode: lockCode.trim(),
      percentage: lockPercentage,
    });
    setLoading(null);
    if (r.error) {
      setError(r.error);
    } else {
      // Append new lock to local state
      const newLock: LockData = {
        id: `temp-${Date.now()}`,
        motif: lockMotif.trim(),
        securityCode: lockCode.trim(),
        percentage: lockPercentage,
        isResolved: false,
        createdAt: new Date(),
      };
      setLocks((prev) => [...prev, newLock].sort((a, b) => a.percentage - b.percentage));
      setPanel("actions");
      setLockMotif("");
      setLockCode("");
      setLockPercentage(Math.min(lockPercentage + 1, 99));
      setShowLocks(true); // auto-expand to show the new lock
    }
  }

  function handleCopy(lockId: string, code: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(lockId);
    if (copyTimeout.current) clearTimeout(copyTimeout.current);
    copyTimeout.current = setTimeout(() => setCopiedId(null), 2000);
  }

  // ── REJECT PANEL ─────────────────────────────────────────
  if (panel === "reject") {
    return (
      <div className="min-w-[280px] p-4 rounded-xl border border-red-200 bg-red-50/50 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
              <ShieldX size={12} className="text-red-600" />
            </div>
            <span className="text-xs font-semibold text-slate-700">Rejeter {reference}</span>
          </div>
          <button onClick={() => { setPanel("actions"); setError(""); }} className="text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        </div>
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-100 border border-red-200">
            <AlertTriangle size={12} className="text-red-600 flex-shrink-0" />
            <span className="text-xs text-red-700">{error}</span>
          </div>
        )}
        <textarea
          placeholder="Motif du rejet..."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-red-200 rounded-lg text-xs resize-none focus:outline-none focus:ring-2 focus:ring-red-300/50 focus:border-red-300 bg-white"
        />
        <Button size="sm" variant="danger" onClick={handleReject} loading={loading === "reject"} className="w-full !text-xs">
          <ShieldX size={12} /> Rejeter la transaction
        </Button>
      </div>
    );
  }

  // ── ADD LOCK PANEL ───────────────────────────────────────
  if (panel === "lock") {
    return (
      <div className="min-w-[300px] p-4 rounded-xl border border-amber-200 bg-amber-50/50 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
              <Lock size={12} className="text-amber-600" />
            </div>
            <span className="text-xs font-semibold text-slate-700">Ajouter un verrou — {reference}</span>
          </div>
          <button onClick={() => { setPanel("actions"); setError(""); }} className="text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        </div>
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-100 border border-red-200">
            <AlertTriangle size={12} className="text-red-600 flex-shrink-0" />
            <span className="text-xs text-red-700">{error}</span>
          </div>
        )}
        <input
          placeholder="Motif / Raison..."
          value={lockMotif}
          onChange={(e) => setLockMotif(e.target.value)}
          className="w-full px-3 py-2 border border-amber-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-300/50 focus:border-amber-300 bg-white"
        />
        <input
          placeholder="Code de sécurité (ex. TX-8294)"
          value={lockCode}
          onChange={(e) => setLockCode(e.target.value)}
          className="w-full px-3 py-2 border border-amber-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-300/50 focus:border-amber-300 bg-white"
        />
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] text-slate-500 font-medium">Point de contrôle à</label>
            <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">{lockPercentage}%</span>
          </div>
          <input
            type="range"
            min={lockFloor + 1}
            max={99}
            step={1}
            value={lockPercentage}
            onChange={(e) => setLockPercentage(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #d97706 ${((lockPercentage - (lockFloor + 1)) / (99 - (lockFloor + 1))) * 100}%, #e2e8f0 ${((lockPercentage - (lockFloor + 1)) / (99 - (lockFloor + 1))) * 100}%)`,
            }}
          />
          <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
            <span>{lockFloor + 1}%</span>
            <span>99%</span>
          </div>
        </div>
        <Button size="sm" className="w-full !text-xs bg-amber-500 hover:bg-amber-600 text-white" onClick={handleAddLock} loading={loading === "lock"}>
          <Lock size={12} /> Ajouter un verrou à {lockPercentage}%
        </Button>
      </div>
    );
  }

  // ── MAIN ACTIONS VIEW ────────────────────────────────────
  const resolvedCount = locks.filter((l) => l.isResolved).length;
  const hasLocks = locks.length > 0;

  return (
    <div className="min-w-[220px] space-y-2">
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
          <AlertTriangle size={12} className="text-red-500 flex-shrink-0" />
          <span className="text-xs text-red-600 flex-1">{error}</span>
          <button onClick={() => setError("")} className="text-red-400 hover:text-red-600">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {canApprove && (
          <Button
            size="sm"
            onClick={handleApprove}
            loading={loading === "approve"}
            className="!text-xs bg-emerald-600 hover:bg-emerald-700 text-white !px-3"
          >
            <ShieldCheck size={12} /> Approuver
          </Button>
        )}
        {canReject && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setPanel("reject"); setError(""); }}
            className="!text-xs !border-red-300 !text-red-600 hover:!bg-red-50 !px-3"
          >
            <ShieldX size={12} /> Rejeter
          </Button>
        )}
        {canLock && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setPanel("lock"); setError(""); }}
            className="!text-xs !border-amber-300 !text-amber-700 hover:!bg-amber-50 !px-3"
          >
            <Lock size={12} /> Verrou
          </Button>
        )}
        {isTerminal && !hasLocks && (
          <span className="text-xs text-slate-400 italic">Aucune action disponible</span>
        )}
      </div>

      {/* Lock list toggle */}
      {hasLocks && (
        <div>
          <button
            onClick={() => setShowLocks((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            <Lock size={10} />
            <span>
              {locks.length} verrou{locks.length > 1 ? "s" : ""}
              {" "}
              <span className="text-slate-400">({resolvedCount}/{locks.length} résolus)</span>
            </span>
            {showLocks ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {showLocks && (
            <div className="mt-2 space-y-1.5">
              {locks.map((lock) => (
                <div
                  key={lock.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${
                    lock.isResolved
                      ? "border-emerald-200 bg-emerald-50/50"
                      : "border-amber-200 bg-amber-50/50"
                  }`}
                >
                  {/* Percentage pill */}
                  <span className={`flex-shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    lock.isResolved
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {lock.percentage}%
                  </span>

                  {/* Motif */}
                  <span className="flex-1 text-slate-600 truncate" title={lock.motif}>
                    {lock.motif}
                  </span>

                  {/* Security code with copy */}
                  <button
                    onClick={() => handleCopy(lock.id, lock.securityCode)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-slate-200 hover:border-slate-300 text-[10px] font-mono text-slate-600 transition-colors"
                    title="Copier le code de sécurité"
                  >
                    {copiedId === lock.id ? (
                      <>
                        <Check size={10} className="text-emerald-500" />
                        <span className="text-emerald-600">Copié</span>
                      </>
                    ) : (
                      <>
                        <Copy size={10} />
                        <span>{lock.securityCode}</span>
                      </>
                    )}
                  </button>

                  {/* Status badge */}
                  <Badge variant={lock.isResolved ? "success" : "warning"} className="!text-[9px] !px-1.5 !py-0.5">
                    {lock.isResolved ? "Résolu" : "En attente"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
