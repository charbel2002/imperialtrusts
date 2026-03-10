"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useDict } from "@/components/shared/dict-provider";
import { resolveTransactionLock, completeTransaction, updateTransactionProgress } from "@/actions/transactions";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/index";
import { formatCurrency } from "@/lib/utils";
import {
  Lock, Unlock, CheckCircle, XCircle, Key, Send,
  PartyPopper, Mail,
} from "lucide-react";

interface LockData {
  id: string;
  motif: string;
  percentage: number;
  isResolved: boolean;
}

interface Props {
  transactionId: string;
  reference: string;
  amount: number;
  currency: string;
  beneficiaryName: string;
  initialLocks: LockData[];
  initialProgress?: number;
}

// Compute initial paused state synchronously so the animation never
// starts before we know whether we're sitting on a lock.
function getInitialLockState(locks: LockData[], progress: number) {
  const sorted = [...locks].sort((a, b) => a.percentage - b.percentage);
  // If progress is at or past an unresolved lock, pause immediately
  const hit = sorted.find((l) => !l.isResolved && l.percentage <= progress);
  if (hit) return { paused: true, currentLock: hit };
  return { paused: false, currentLock: null as LockData | null };
}

/** Find the next unresolved lock strictly ahead of current progress */
function findNextCheckpoint(locks: LockData[], progress: number): LockData | null {
  const sorted = [...locks].sort((a, b) => a.percentage - b.percentage);
  return sorted.find((l) => !l.isResolved && l.percentage > progress) ?? null;
}

export function TransactionProgressTracker({
  transactionId,
  reference,
  amount,
  currency,
  beneficiaryName,
  initialLocks,
  initialProgress = 0,
}: Props) {
  const dict = useDict();
  const tp = dict.txnProgress || {};
  const [locks, setLocks] = useState<LockData[]>(initialLocks);
  const [progress, setProgress] = useState(initialProgress);

  // Compute initial pause state synchronously — no separate useEffect race
  const initState = useMemo(() => getInitialLockState(initialLocks, initialProgress), []);
  const [paused, setPaused] = useState(initState.paused);
  const [currentLock, setCurrentLock] = useState<LockData | null>(initState.currentLock);

  const [completed, setCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");

  // Guard so handleComplete fires exactly once
  const completingRef = useRef(false);

  // Refs so the interval callback always reads the latest values
  const progressRef = useRef(initialProgress);
  const locksRef = useRef(initialLocks);
  useEffect(() => { locksRef.current = locks; }, [locks]);

  // ── Tick-based animation: +1 % every 500 ms ──────────────
  useEffect(() => {
    if (completed || paused) return;

    const interval = setInterval(() => {
      const prev = progressRef.current;
      const next = Math.min(prev + 1, 100);

      // Find the next unresolved checkpoint ahead
      const checkpoint = findNextCheckpoint(locksRef.current, prev);

      // If this tick reaches a checkpoint, stop exactly there
      if (checkpoint && next >= checkpoint.percentage) {
        progressRef.current = checkpoint.percentage;
        setProgress(checkpoint.percentage);
        updateTransactionProgress(transactionId, checkpoint.percentage);
        setPaused(true);
        setCurrentLock(checkpoint);
        return;
      }

      // If we've reached 100 %, settle
      if (next >= 100) {
        progressRef.current = 100;
        setProgress(100);
        if (!completingRef.current) {
          completingRef.current = true;
          handleComplete();
        }
        return;
      }

      // Normal tick — advance by 1 %
      progressRef.current = next;
      setProgress(next);
      updateTransactionProgress(transactionId, next);
    }, 500);

    return () => clearInterval(interval);
  }, [completed, paused]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleComplete() {
    setCompleting(true);
    updateTransactionProgress(transactionId, 100);
    const result = await completeTransaction(transactionId);
    if (result.error) {
      setCompleting(false);
      setError(result.error);
    } else {
      // Brief pause so the user registers the finalizing state
      await new Promise((r) => setTimeout(r, 800));
      setCompleting(false);
      setCompleted(true);
    }
  }

  function handleLockResolved(lockId: string) {
    setLocks((prev) => prev.map((l) => (l.id === lockId ? { ...l, isResolved: true } : l)));
    setCurrentLock(null);
    setPaused(false);
    setError("");
  }

  // --- COMPLETED VIEW ---------------------------------------

  if (completed) {
    return (
      <div className="animate-fade-in-up p-8 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 text-center">
        <div className="relative inline-block mb-4">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto animate-bounce" style={{ animationDuration: "1.5s", animationIterationCount: "2" }}>
            <PartyPopper size={36} className="text-emerald-600" />
          </div>
          <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
            <CheckCircle size={16} className="text-white" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-800 font-heading">{tp.successTitle || "Transfer Successful!"}</h2>
        <p className="mt-2 text-slate-500">
          {formatCurrency(amount, currency)} {tp.successSentTo || "has been sent to"} <strong>{beneficiaryName}</strong>
        </p>

        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-sm font-mono text-slate-600">
          Ref: {reference}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Mail size={14} />
          <span>{tp.emailConfirmation || "A confirmation email has been sent to your registered address"}</span>
        </div>

        {/* Progress bar at 100% */}
        <div className="mt-8 relative">
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full w-full transition-all" />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-slate-400">{tp.initiated || "Initiated"}</span>
            <span className="text-[10px] text-emerald-600 font-semibold">{tp.completed || "Completed"}</span>
          </div>
        </div>
      </div>
    );
  }

  // --- PROCESSING VIEW (progress bar + locks) ---------------

  return (
    <div className="p-6 rounded-2xl border border-slate-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Send size={16} className="text-secondary" />
          <span className="text-sm font-semibold text-slate-800">{tp.processingTransfer || "Processing Transfer"}</span>
        </div>
        <span className="text-sm font-bold text-secondary font-heading">
          {Math.round(progress)}%
        </span>
      </div>

      <p className="text-xs text-slate-400 mb-5">
        Sending {formatCurrency(amount, currency)} to {beneficiaryName} - {reference}
      </p>

      {error && (
        <Alert variant="danger" className="mb-4 !text-xs">
          <XCircle size={14} className="flex-shrink-0" />{error}
        </Alert>
      )}

      {/* === PROGRESS BAR === */}
      <div className="relative mb-6">
        {/* Track */}
        <div className="h-4 bg-slate-100 rounded-full overflow-hidden relative">
          {/* Filled portion */}
          <div
            className="h-full rounded-full transition-all duration-500 ease-linear relative"
            style={{
              width: `${progress}%`,
              background: paused
                ? "linear-gradient(90deg, #f59e0b, #d97706)"
                : "linear-gradient(90deg, #10B981, #059669)",
            }}
          >
            {/* Shimmer effect when moving */}
            {!paused && progress < 100 && (
              <div className="absolute inset-0 overflow-hidden rounded-full">
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                    animation: "shimmer 1.5s infinite",
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* === LOCK FORM (when paused at a checkpoint) === */}
      {currentLock && paused && (
        <LockResolver
          lock={currentLock}
          onResolved={(id) => handleLockResolved(id)}
          onError={(msg) => setError(msg)}
        />
      )}

      {/* Waiting indicator when not paused */}
      {!paused && !completed && !completing && progress < 100 && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {tp.processing || "Transaction processing..."}
        </div>
      )}

      {/* === FINALIZING OVERLAY === */}
      {completing && (
        <div className="animate-fade-in-up rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-7 w-7 animate-spin text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-emerald-800">
            {tp.finalizingTitle || "Securing Your Transfer"}
          </p>
          <p className="mt-1 text-xs text-emerald-600/80">
            {tp.finalizingSubtitle || "Verifying details and processing your payment…"}
          </p>
          <div className="mt-4 flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"
                style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

// --- Lock Resolver Sub-Component ----------------------------

function LockResolver({
  lock,
  onResolved,
  onError,
}: {
  lock: LockData;
  onResolved: (id: string) => void;
  onError: (msg: string) => void;
}) {
  const dict = useDict();
  const tp = dict.txnProgress || {};
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit() {
    if (!code.trim()) {
      setLocalError(tp.enterCodeError || "Enter the security code");
      return;
    }
    setLoading(true);
    setLocalError("");
    const result = await resolveTransactionLock(lock.id, code.trim());
    setLoading(false);

    if (result.error) {
      setLocalError(result.error);
    } else {
      onResolved(lock.id);
    }
  }

  return (
    <div className="p-5 rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-white animate-fade-in-up" style={{ animationDuration: "0.3s" }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center animate-pulse">
          <Lock size={18} className="text-amber-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-amber-900">{tp.securityRequired || "Security Verification Required"}</h3>
          <p className="text-xs text-amber-700">{tp.pausedAt || "Transaction paused at"} {lock.percentage}%</p>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-amber-100/50 border border-amber-200 mb-4">
        <p className="text-xs text-amber-800">
          <strong>{tp.reason || "Reason"}:</strong> {lock.motif}
        </p>
        <p className="text-[10px] text-amber-600 mt-1">
          {tp.lockInstruction || "Enter the security code provided by your account administrator to continue."}
        </p>
      </div>

      {localError && (
        <div className="flex items-center gap-2 text-xs text-red-600 mb-3">
          <XCircle size={12} /> {localError}
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder={tp.enterCode || "Enter security code"}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="w-full pl-9 pr-4 py-2.5 border-2 border-amber-300 rounded-lg text-sm font-mono bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
          />
        </div>
        <Button
          onClick={handleSubmit}
          loading={loading}
          className="bg-amber-500 hover:bg-amber-600 text-white"
        >
          <Unlock size={16} /> Verify
        </Button>
      </div>
    </div>
  );
}
