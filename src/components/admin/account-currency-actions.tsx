"use client";

import { useState } from "react";
import { setAccountCurrency } from "@/actions/accounts";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/index";
import { CheckCircle, XCircle, Coins } from "lucide-react";
import { SUPPORTED_CURRENCIES, type SupportedCurrency } from "@/lib/currencies";

interface Props {
  accountId: string;
  currentCurrency: string;
  userName: string;
}

export function AccountCurrencyActions({ accountId, currentCurrency, userName }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleCurrencyChange(currency: SupportedCurrency) {
    if (currency === currentCurrency) return;
    setLoading(currency);
    setError("");
    setSuccess("");

    const result = await setAccountCurrency(accountId, currency);
    setLoading(null);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(`La devise du compte de ${userName} a été changée en ${currency}.`);
    }
  }

  return (
    <div>
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

      <div className="flex items-center gap-2 mb-3">
        <Coins size={16} className="text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-700">Changer la devise</h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {SUPPORTED_CURRENCIES.map((c) => (
          <Button
            key={c}
            variant={c === currentCurrency ? "primary" : "ghost"}
            size="sm"
            onClick={() => handleCurrencyChange(c)}
            loading={loading === c}
            disabled={c === currentCurrency}
            className={c === currentCurrency ? "" : "text-slate-600 hover:bg-slate-100"}
          >
            {c}
          </Button>
        ))}
      </div>

      <p className="text-xs text-slate-400 mt-2">
        Devise actuelle : <span className="font-semibold">{currentCurrency}</span>
      </p>
    </div>
  );
}
