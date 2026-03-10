"use client";

import { useDict } from "@/components/shared/dict-provider";

import { useState } from "react";
import { cancelTransaction } from "@/actions/transactions";
import { TransactionProgressTracker } from "./transaction-progress-tracker";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/index";
import { X, CheckCircle, XCircle, Lock } from "lucide-react";

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
  status: string;
  progress: number;
  locks: LockData[];
}

export function TransactionActions({
  transactionId,
  reference,
  amount,
  currency,
  beneficiaryName,
  status,
  progress: savedProgress,
  locks,
}: Props) {
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const dict = useDict();
  const tp = dict.txnProgress || {};
  const tt = (dict.txnPage || {}) as any;
  const [cancelled, setCancelled] = useState(false);

  const canCancel = ["INITIALIZED", "PENDING"].includes(status);
  const isProcessing = status === "PROCESSING";

  async function handleCancel() {
    if (!confirm(tp.cancelConfirm || "Cancel this transaction? This cannot be undone.")) return;
    setCancelling(true);
    setError("");
    const result = await cancelTransaction(transactionId);
    setCancelling(false);
    if (result.error) setError(result.error);
    else setCancelled(true);
  }

  if (cancelled) {
    return (
      <Alert variant="success" className="!py-2 !text-xs">
        <CheckCircle size={12} className="flex-shrink-0" />{tt.cancelled || "Transaction cancelled."}
      </Alert>
    );
  }

  return (
    <div>
      {error && (
        <Alert variant="danger" className="!py-2 !text-xs mb-3">
          <XCircle size={12} className="flex-shrink-0" />{error}
        </Alert>
      )}

      {/* Progress Tracker for PROCESSING transactions */}
      {isProcessing && (
        <TransactionProgressTracker
          transactionId={transactionId}
          reference={reference}
          amount={amount}
          currency={currency}
          beneficiaryName={beneficiaryName}
          initialLocks={locks}
          initialProgress={savedProgress}
        />
      )}

      {/* Cancel button */}
      {canCancel && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          loading={cancelling}
          className="text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <X size={14} /> {tt.cancelBtn || "Cancel Transaction"}
        </Button>
      )}
    </div>
  );
}
