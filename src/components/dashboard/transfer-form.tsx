"use client";

import { useDict } from "@/components/shared/dict-provider";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { initiateTransfer } from "@/actions/transactions";
import { Input, Textarea, Alert } from "@/components/ui/index";
import { Button } from "@/components/ui/button";
import { formatCurrency, cn } from "@/lib/utils";
import { Send, CheckCircle, XCircle, Building2, Globe } from "lucide-react";

interface Beneficiary {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  country: string;
}

interface Props {
  beneficiaries: Beneficiary[];
  maxAmount: number;
  currency: string;
}

export function TransferForm({ beneficiaries, maxAmount, currency }: Props) {
  const router = useRouter();
  const dict = useDict();
  const tt = dict.transfersPage || {};
  const [beneficiaryId, setBeneficiaryId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ reference: string } | null>(null);

  const selected = beneficiaries.find((b) => b.id === beneficiaryId);
  const numAmount = parseFloat(amount) || 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!beneficiaryId) { setError(dict.txnProgress?.selectBeneficiary || "Please select a beneficiary"); return; }
    if (numAmount <= 0) { setError(dict.txnProgress?.enterValidAmount || "Enter a valid amount"); return; }
    if (numAmount > maxAmount) { setError(`Amount exceeds available balance (${formatCurrency(maxAmount, currency)})`); return; }

    setLoading(true);
    setError("");
    const result = await initiateTransfer({
      beneficiaryId,
      amount: numAmount,
      description: description.trim() || undefined,
    });
    setLoading(false);

    if (result.error) setError(result.error);
    else setSuccess({ reference: result.reference! });
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 font-heading">Transfer Submitted</h3>
        <p className="mt-2 text-sm text-slate-500">
          Your transfer of {formatCurrency(numAmount, currency)} to {selected?.name} is now pending review.
        </p>
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-mono text-slate-600">
          Ref: {success.reference}
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <Button size="sm" onClick={() => { setSuccess(null); setBeneficiaryId(""); setAmount(""); setDescription(""); }}>
            New Transfer
          </Button>
          <Button size="sm" variant="ghost" onClick={() => router.push("/dashboard/transactions")}>
            View Transactions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <Alert variant="danger"><XCircle size={14} className="flex-shrink-0" />{error}</Alert>}

      {/* Beneficiary Selector */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Select Beneficiary</label>
        <div className="grid gap-2 max-h-64 overflow-y-auto">
          {beneficiaries.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setBeneficiaryId(b.id)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
                beneficiaryId === b.id
                  ? "border-secondary bg-blue-50/50 ring-1 ring-secondary/20"
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {b.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800 truncate">{b.name}</p>
                <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-0.5">
                  <span className="flex items-center gap-1"><Building2 size={9} />{b.bankName}</span>
                  <span className="flex items-center gap-1"><Globe size={9} />{b.country}</span>
                </div>
              </div>
              {beneficiaryId === b.id && <CheckCircle size={18} className="text-secondary flex-shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount ({currency})</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-medium">$</span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg text-lg font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
            required
          />
        </div>
        <p className="text-xs text-slate-400 mt-1">Available: {formatCurrency(maxAmount, currency)}</p>
      </div>

      {/* Description */}
      <Textarea
        label={tt.description || "Description (optional)"}
        placeholder="e.g., Invoice payment, Rent, Gift..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
      />

      {/* Summary */}
      {beneficiaryId && numAmount > 0 && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">To</span>
            <span className="font-medium text-slate-800">{selected?.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Bank</span>
            <span className="text-slate-700">{selected?.bankName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Amount</span>
            <span className="font-bold text-slate-800">{formatCurrency(numAmount, currency)}</span>
          </div>
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full" size="lg" variant="accent">
        <Send size={18} /> {tt.sendBtn || "Send"} {numAmount > 0 ? formatCurrency(numAmount, currency) : ""}
      </Button>
    </form>
  );
}
