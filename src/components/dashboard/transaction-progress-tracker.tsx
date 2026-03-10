"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  if (progress > 0) {
    const hit = sorted.find((l) => !l.isResolved && l.percentage <= progress + 0.5);
    if (hit) return { paused: true, currentLock: hit };
  }
  return { paused: false, currentLock: null as LockData | null };
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
  const animRef = useRef<number | null>(null);
  const speedRef = useRef(0.3); // % per frame tick
  const lastSavedRef = useRef(Math.floor(initialProgress / 5) * 5);

  // Stable sorted locks — only recompute when the locks array actually changes
  const sortedLocks = useMemo(
    () => [...locks].sort((a, b) => a.percentage - b.percentage),
    [locks]
  );

  // Keep a ref so the animation loop always reads the latest locks
  // without needing sortedLocks in the effect dependency array
  const locksRef = useRef(sortedLocks);
  useEffect(() => {
    locksRef.current = sortedLocks;
  }, [sortedLocks]);

  // Save progress to DB every 5% increment
  function saveProgressIfNeeded(currentProgress: number) {
    const milestone = Math.floor(currentProgress / 5) * 5;
    if (milestone > lastSavedRef.current) {
      lastSavedRef.current = milestone;
      // Fire and forget - don't await, don't block animation
      updateTransactionProgress(transactionId, milestone);
    }
  }

  // Animation loop — depends only on completed & paused (both stable booleans)
  useEffect(() => {
    if (completed || paused) return;

    const animate = () => {
      setProgress((prev) => {
        const next = Math.min(prev + speedRef.current, 100);

        // Save every 5% milestone
        saveProgressIfNeeded(next);

        // Check if we hit a lock checkpoint (read from ref, always fresh)
        const hitLock = locksRef.current.find(
          (l) => !l.isResolved && prev < l.percentage && next >= l.percentage
        );

        if (hitLock) {
          setPaused(true);
          setCurrentLock(hitLock);
          updateTransactionProgress(transactionId, hitLock.percentage);
          return hitLock.percentage;
        }

        // Reached 100%
        if (next >= 100) {
          handleComplete();
          return 100;
        }

        return next;
      });

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [completed, paused]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleComplete() {
    setCompleting(true);
    const result = await completeTransaction(transactionId);
    setCompleting(false);
    if (result.error) {
      setError(result.error);
    } else {
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
      <div className="p-8 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 text-center">
        <div className="relative inline-block mb-4">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
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
            className="h-full rounded-full transition-all duration-75 ease-linear relative"
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
      {!paused && !completed && progress < 100 && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {tp.processing || "Transaction processing..."}
        </div>
      )}

      {completing && (
        <div className="flex items-center gap-2 text-xs text-secondary">
          <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          {tp.finalizing || "Finalizing transfer..."}
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
