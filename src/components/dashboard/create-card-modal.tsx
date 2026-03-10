"use client";

import { useDict } from "@/components/shared/dict-provider";

import { useState } from "react";
import { createCard } from "@/actions/cards";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/index";
import { cn } from "@/lib/utils";
import { CreditCard, Plus, X, CheckCircle, XCircle } from "lucide-react";

export function CreateCardModal() {
  const dict = useDict();
  const tc = dict.common || {};
  const tdc = (dict.dashboardCards || {}) as any;
  const [open, setOpen] = useState(false);
  const [cardType, setCardType] = useState<"VISA" | "MASTERCARD">("VISA");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleCreate() {
    setLoading(true);
    setError("");
    const result = await createCard(cardType);
    setLoading(false);
    if (result.error) setError(result.error);
    else { setSuccess(true); setTimeout(() => { setOpen(false); setSuccess(false); }, 1500); }
  }

  if (!open) {
    return (
      <Button onClick={() => { setOpen(true); setError(""); setSuccess(false); }} size="sm">
        <Plus size={16} /> {tdc.newCard || "New Card"}
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up" style={{ animationDuration: "0.25s" }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-800 font-heading">{tdc.createTitle || "Create Virtual Card"}</h2>
          <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={20} /></button>
        </div>

        {success ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={28} className="text-emerald-600" />
            </div>
            <p className="text-base font-semibold text-slate-800">{tdc.cardCreated || "Card Created!"}</p>
            <p className="text-sm text-slate-500 mt-1">{(tdc.cardReadyMsg || "Your new {{type}} card is ready.").replace("{{type}}", cardType)}</p>
          </div>
        ) : (
          <>
            {error && <Alert variant="danger" className="mb-4"><XCircle size={14} className="flex-shrink-0" />{error}</Alert>}

            <p className="text-sm text-slate-500 mb-5">{tdc.createDesc || "Choose your card network. Your virtual card will be created instantly with a unique number and CVV."}</p>

            {/* Card Type Selector */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {(["VISA", "MASTERCARD"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setCardType(type)}
                  className={cn(
                    "relative p-5 rounded-xl border-2 transition-all duration-200 text-center",
                    cardType === type
                      ? "border-secondary bg-blue-50/50 ring-2 ring-secondary/20"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  {type === "VISA" ? (
                    <span className="text-2xl font-bold text-[#1A1F71] tracking-wider">VISA</span>
                  ) : (
                    <div className="flex justify-center -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-red-500/80" />
                      <div className="w-8 h-8 rounded-full bg-yellow-500/70" />
                    </div>
                  )}
                  <p className="text-xs text-slate-500 mt-2">{type === "VISA" ? "Visa" : "Mastercard"}</p>
                  {cardType === type && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-secondary flex items-center justify-center">
                      <CheckCircle size={12} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Info */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 mb-6">
              <div className="flex items-start gap-2 text-xs text-slate-500">
                <CreditCard size={14} className="flex-shrink-0 mt-0.5 text-slate-400" />
                <span>{dict.txnProgress?.cardCreateInfo || "Card will be created with $0.00 balance. You can fund it from your bank account after creation."}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleCreate} loading={loading} className="flex-1">
                <Plus size={16} /> {(tdc.createBtn || "Create {{type}} Card").replace("{{type}}", cardType === "VISA" ? "Visa" : "Mastercard")}
              </Button>
              <Button variant="ghost" onClick={() => setOpen(false)}>{tc.cancel || "Cancel"}</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
