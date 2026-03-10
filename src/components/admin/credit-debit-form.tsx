"use client";

import { useState } from "react";
import { adminCreditAccount, adminDebitAccount } from "@/actions/accounts";
import { Input, Alert } from "@/components/ui/index";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import { Plus, Minus, CheckCircle, XCircle } from "lucide-react";

interface Props {
  accountId: string;
  userName: string;
  currentBalance: number;
  currency: string;
}

export function CreditDebitForm({ accountId, userName, currentBalance, currency }: Props) {
  const [mode, setMode] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Veuillez saisir un montant positif valide");
      setLoading(false);
      return;
    }

    if (!description.trim()) {
      setError("La description est requise");
      setLoading(false);
      return;
    }

    const action = mode === "credit" ? adminCreditAccount : adminDebitAccount;
    const result = await action({
      accountId,
      amount: numAmount,
      description: description.trim(),
    });

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(
        `${formatCurrency(numAmount, currency)} ${mode === "credit" ? "crédité(e) avec succès sur" : "débité(e) avec succès du"} compte de ${userName}.`
      );
      setAmount("");
      setDescription("");
    }
  }

  return (
    <div>
      {/* Mode Toggle */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 mb-6">
        <button
          onClick={() => { setMode("credit"); setError(""); setSuccess(""); }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
            mode === "credit" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <Plus size={16} /> Crédit
        </button>
        <button
          onClick={() => { setMode("debit"); setError(""); setSuccess(""); }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
            mode === "debit" ? "bg-white text-red-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <Minus size={16} /> Débit
        </button>
      </div>

      {/* Current Balance Note */}
      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 mb-5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Solde actuel</span>
          <span className="text-sm font-bold text-slate-800">{formatCurrency(currentBalance, currency)}</span>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          <XCircle size={16} className="flex-shrink-0" />{error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="mb-4">
          <CheckCircle size={16} className="flex-shrink-0" />{success}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Montant ({currency})
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
              required
            />
          </div>
        </div>

        <Input
          label="Description / Motif"
          placeholder={
            mode === "credit"
              ? "ex. Dépôt, Bonus, Remboursement, Versement de prêt..."
              : "ex. Correction, Déduction de frais, Pénalité..."
          }
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <Button
          type="submit"
          variant={mode === "credit" ? "accent" : "danger"}
          loading={loading}
          className="w-full"
        >
          {mode === "credit" ? (
            <><Plus size={16} /> Créditer {amount ? formatCurrency(parseFloat(amount) || 0, currency) : "le compte"}</>
          ) : (
            <><Minus size={16} /> Débiter {amount ? formatCurrency(parseFloat(amount) || 0, currency) : "le compte"}</>
          )}
        </Button>
      </form>
    </div>
  );
}
