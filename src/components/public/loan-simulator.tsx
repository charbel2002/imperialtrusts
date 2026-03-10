"use client";

import { useState } from "react";
import { calculateMonthlyPayment, formatCurrency } from "@/lib/utils";
import { translateActionError } from "@/lib/translate-error";
import { submitLoanApplication } from "@/actions/loans";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/index";
import { ArrowRight, CheckCircle } from "lucide-react";

export function LoanSimulator({ dict }: { dict: Record<string, any> }) {
  const t = dict.loanSim;
  const [amount, setAmount] = useState<number | "">(10000);
  const [duration, setDuration] = useState(12);
  const rate = 3;
  const [email, setEmail] = useState("");
  const [showApply, setShowApply] = useState(false);
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const numAmount = typeof amount === "number" ? amount : 0;
  const monthly = calculateMonthlyPayment(numAmount, duration, rate);
  const total = monthly * duration;
  const interest = total - numAmount;

  async function handleApply() {
    setLoading(true); setError("");
    const result = await submitLoanApplication({ email, amount: numAmount, durationMonths: duration, interestRate: rate });
    setLoading(false);
    if (result.error) setError(translateActionError(result.error, dict)); else { setApplied(true); setShowApply(false); }
  }

  if (applied) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5"><CheckCircle size={32} className="text-emerald-600" /></div>
        <h3 className="text-2xl font-bold text-primary font-heading">{t.successTitle}</h3>
        <p className="mt-2 text-slate-500">{t.successMsg} <strong>{email}</strong>.</p>
        <p className="mt-1 text-sm text-slate-400">{t.successSub}</p>
        <Button variant="outline" className="mt-8" onClick={() => { setApplied(false); setEmail(""); }}>{t.another}</Button>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-5 gap-10">
      <div className="lg:col-span-3 space-y-8">
        <SliderField label={t.amount} prefix="€" value={numAmount} onChange={(v) => setAmount(v)} min={500} max={500000} step={500} color="#1E40AF" rawValue={amount === "" ? "" : undefined} onRawChange={(raw) => { if (raw === "") setAmount(""); else setAmount(Number(raw)); }} />
        <SliderField label={t.duration} suffix={t.months} value={duration} onChange={setDuration} min={3} max={120} step={1} color="#1E40AF" />
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-700">{t.rate}</label>
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-primary">{rate}</span>
              <span className="text-sm text-slate-400">%</span>
            </div>
          </div>
          <div className="w-full h-2 rounded-full" style={{ background: `linear-gradient(to right, #10B981 10%, #e2e8f0 10%)` }} />
          <p className="text-xs text-slate-400 mt-1">{t.fixedRate || "Fixed rate"}</p>
        </div>
      </div>
      <div className="lg:col-span-2">
        <div className="rounded-2xl bg-gradient-to-br from-primary to-secondary-700 p-8 text-white sticky top-24">
          <p className="text-sm text-slate-400 uppercase tracking-wider mb-1">{t.monthly}</p>
          <p className="text-4xl font-bold tracking-tight font-heading">{formatCurrency(monthly, "EUR")}</p>
          <div className="mt-8 space-y-4">
            <div className="flex justify-between items-center py-3 border-t border-white/10"><span className="text-sm text-slate-400">{t.loanAmount}</span><span className="text-sm font-semibold">{formatCurrency(numAmount, "EUR")}</span></div>
            <div className="flex justify-between items-center py-3 border-t border-white/10"><span className="text-sm text-slate-400">{t.totalInterest}</span><span className="text-sm font-semibold text-accent">{formatCurrency(interest, "EUR")}</span></div>
            <div className="flex justify-between items-center py-3 border-t border-white/10"><span className="text-sm text-slate-400">{t.totalRepayment}</span><span className="text-sm font-bold text-lg">{formatCurrency(total, "EUR")}</span></div>
          </div>
          {showApply ? (
            <div className="mt-6 pt-6 border-t border-white/10">
              <label className="text-sm text-slate-300 mb-2 block">{t.emailLabel}</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="john@example.com" className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40" />
              {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
              <div className="flex gap-3 mt-4">
                <Button variant="accent" className="flex-1" onClick={handleApply} loading={loading}>{t.submit}</Button>
                <Button variant="ghost" className="text-white/70 border border-white/20 hover:bg-white/5" onClick={() => setShowApply(false)}>{t.cancel}</Button>
              </div>
            </div>
          ) : (
            <Button variant="accent" className="w-full mt-6 shadow-lg shadow-accent/20" onClick={() => setShowApply(true)}>{t.apply} <ArrowRight size={16} /></Button>
          )}
        </div>
      </div>
    </div>
  );
}

function SliderField({ label, prefix, suffix, value, onChange, min, max, step, color, rawValue, onRawChange }: {
  label: string; prefix?: string; suffix?: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; color: string; rawValue?: string; onRawChange?: (raw: string) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const inputValue = rawValue !== undefined ? rawValue : value;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <div className="flex items-center gap-1">
          {prefix && <span className="text-sm text-slate-400">{prefix}</span>}
          <input type="number" value={inputValue} onChange={(e) => {
            if (onRawChange) { onRawChange(e.target.value); }
            else { onChange(Number(e.target.value)); }
          }} min={min} max={max} step={step}
            className="w-24 text-right text-sm font-semibold text-primary border-0 border-b-2 border-slate-200 focus:border-secondary focus:ring-0 px-1 py-0.5 bg-transparent" />
          {suffix && <span className="text-sm text-slate-400">{suffix}</span>}
        </div>
      </div>
      <input type="range" value={value} onChange={(e) => onChange(Number(e.target.value))} min={min} max={max} step={step}
        className="w-full h-2 rounded-full cursor-pointer" style={{ background: `linear-gradient(to right, ${color} ${pct}%, #e2e8f0 ${pct}%)` }} />
      <div className="flex justify-between text-xs text-slate-400 mt-1"><span>{prefix}{min}</span><span>{prefix}{max.toLocaleString()}</span></div>
    </div>
  );
}
