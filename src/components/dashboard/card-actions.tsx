"use client";

import { useDict } from "@/components/shared/dict-provider";

import { useState } from "react";
import { freezeCard, unfreezeCard, fundCard, withdrawFromCard } from "@/actions/cards";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/index";
import { formatCurrency } from "@/lib/utils";
import {
  Snowflake, Sun, Plus, Minus, Eye, EyeOff,
  CheckCircle, XCircle, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  cardId: string;
  cardStatus: string;
  cardLast4: string;
  cardBalance: number;
  accountBalance: number;
  cvv: string;
  currency: string;
}

export function CardActions({
  cardId,
  cardStatus,
  cardLast4,
  cardBalance,
  accountBalance,
  cvv,
  currency,
}: Props) {
  const dict = useDict();
  const tc = dict.cards || {};
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCvv, setShowCvv] = useState(false);
  const [showFund, setShowFund] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState("");

  const isActive = cardStatus === "ACTIVE";
  const isFrozen = cardStatus === "FROZEN";
  const isUsable = isActive || isFrozen;

  async function handleFreeze() {
    setLoading("freeze");
    setError("");
    setSuccess("");
    const result = isActive ? await freezeCard(cardId) : await unfreezeCard(cardId);
    setLoading(null);
    if (result.error) setError(result.error);
    else setSuccess(isActive ? (tc.frozen || "Card frozen") + " v" : (tc.unfreeze || "Card unfrozen") + " v");
  }

  async function handleFund() {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) { setError(tc.enterValidAmount || "Enter a valid amount"); return; }
    setLoading("fund");
    setError("");
    setSuccess("");
    const result = await fundCard({ cardId, amount: num });
    setLoading(null);
    if (result.error) setError(result.error);
    else { setSuccess((tc.addedToCard || "{{amount}} added to card").replace("{{amount}}", formatCurrency(num, currency))); setAmount(""); setShowFund(false); }
  }

  async function handleWithdraw() {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) { setError(tc.enterValidAmount || "Enter a valid amount"); return; }
    setLoading("withdraw");
    setError("");
    setSuccess("");
    const result = await withdrawFromCard({ cardId, amount: num });
    setLoading(null);
    if (result.error) setError(result.error);
    else { setSuccess((tc.withdrawnToAccount || "{{amount}} withdrawn to account").replace("{{amount}}", formatCurrency(num, currency))); setAmount(""); setShowWithdraw(false); }
  }

  return (
    <div className="space-y-3">
      {error && <Alert variant="danger" className="text-xs"><XCircle size={14} className="flex-shrink-0" />{error}</Alert>}
      {success && <Alert variant="success" className="text-xs"><CheckCircle size={14} className="flex-shrink-0" />{success}</Alert>}

      {/* CVV Toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">CVV</p>
          <p className="text-sm font-mono font-bold text-slate-800">{showCvv ? cvv : "***"}</p>
        </div>
        <button onClick={() => setShowCvv(!showCvv)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors">
          {showCvv ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {/* Action Buttons */}
      {isUsable && (
        <div className="flex flex-wrap gap-2">
          {isActive && (
            <>
              <Button size="sm" variant="accent" onClick={() => { setShowFund(true); setShowWithdraw(false); setAmount(""); setError(""); setSuccess(""); }}>
                <Plus size={14} /> {tc.fund || "Fund"}
              </Button>
              {cardBalance > 0 && (
                <Button size="sm" variant="ghost" onClick={() => { setShowWithdraw(true); setShowFund(false); setAmount(""); setError(""); setSuccess(""); }}>
                  <Minus size={14} /> {tc.withdraw || "Withdraw"}
                </Button>
              )}
            </>
          )}
          <Button
            size="sm"
            variant={isActive ? "ghost" : "secondary"}
            onClick={handleFreeze}
            loading={loading === "freeze"}
            className={isActive ? "text-blue-600 hover:bg-blue-50" : ""}
          >
            {isActive ? <><Snowflake size={14} /> {tc.freeze || "Freeze"}</> : <><Sun size={14} /> {tc.unfreeze || "Unfreeze"}</>}
          </Button>
        </div>
      )}

      {/* Fund Modal */}
      {showFund && (
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700">{(tc.fundTitle || "Fund Card **** {{last4}}").replace("{{last4}}", cardLast4)}</h4>
            <button onClick={() => setShowFund(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
          </div>
          <p className="text-xs text-slate-400">{tc.availableInAccount || "Available in account"}: {formatCurrency(accountBalance, currency)}</p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
            <input type="number" step="0.01" min="0.01" placeholder="0.00" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-7 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
            />
          </div>
          <Button size="sm" variant="accent" onClick={handleFund} loading={loading === "fund"} className="w-full">
            <Plus size={14} /> {tc.addFunds || "Add"} {amount ? formatCurrency(parseFloat(amount) || 0, currency) : (dict.txnProgress?.funds || "Funds")}
          </Button>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdraw && (
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700">{tc.withdrawTo || "Withdraw to Account"}</h4>
            <button onClick={() => setShowWithdraw(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
          </div>
          <p className="text-xs text-slate-400">{tc.cardBalance || "Card balance"}: {formatCurrency(cardBalance, currency)}</p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
            <input type="number" step="0.01" min="0.01" placeholder="0.00" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-7 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
            />
          </div>
          <Button size="sm" variant="secondary" onClick={handleWithdraw} loading={loading === "withdraw"} className="w-full">
            <Minus size={14} /> {tc.withdraw || "Withdraw"} {amount ? formatCurrency(parseFloat(amount) || 0, currency) : ""}
          </Button>
        </div>
      )}
    </div>
  );
}
