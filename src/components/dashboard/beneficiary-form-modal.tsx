"use client";

import { useDict } from "@/components/shared/dict-provider";

import { useState } from "react";
import { createBeneficiary, updateBeneficiary } from "@/actions/beneficiaries";
import { translateActionError } from "@/lib/translate-error";
import { Input, Alert } from "@/components/ui/index";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X, CheckCircle, XCircle, Plus, Pencil } from "lucide-react";

interface BeneficiaryData {
  id?: string;
  name: string;
  bankName: string;
  accountNumber: string;
  swift: string;
  country: string;
}

interface Props {
  mode: "create" | "edit";
  defaultValues?: BeneficiaryData;
  onClose: () => void;
  onSuccess: () => void;
}

const COUNTRIES = [
  // Europe
  "Albania", "Andorra", "Austria", "Belarus", "Belgium",
  "Bosnia and Herzegovina", "Bulgaria", "Croatia", "Cyprus", "Czech Republic",
  "Denmark", "Estonia", "Finland", "France", "Germany",
  "Greece", "Hungary", "Iceland", "Ireland", "Italy",
  "Kosovo", "Latvia", "Liechtenstein", "Lithuania", "Luxembourg",
  "Malta", "Moldova", "Monaco", "Montenegro", "Netherlands",
  "North Macedonia", "Norway", "Poland", "Portugal", "Romania",
  "Russia", "San Marino", "Serbia", "Slovakia", "Slovenia",
  "Spain", "Sweden", "Switzerland", "Turkey", "Ukraine",
  "United Kingdom", "Vatican City",
  // Latin America
  "Argentina", "Bolivia", "Brazil", "Chile", "Colombia",
  "Costa Rica", "Cuba", "Dominican Republic", "Ecuador", "El Salvador",
  "Guatemala", "Haiti", "Honduras", "Mexico", "Nicaragua",
  "Panama", "Paraguay", "Peru", "Uruguay", "Venezuela",
];

export function BeneficiaryFormModal({ mode, defaultValues, onClose, onSuccess }: Props) {
  const dict = useDict();
  const tb = dict.beneficiariesPage || {};
  const tc = dict.common || {};
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [bankName, setBankName] = useState(defaultValues?.bankName ?? "");
  const [accountNumber, setAccountNumber] = useState(defaultValues?.accountNumber ?? "");
  const [swift, setSwift] = useState(defaultValues?.swift ?? "");
  const [country, setCountry] = useState(defaultValues?.country ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = { name: name.trim(), bankName: bankName.trim(), accountNumber: accountNumber.trim(), swift: swift.trim() || undefined, country };

    const result = mode === "edit" && defaultValues?.id
      ? await updateBeneficiary(defaultValues.id, payload)
      : await createBeneficiary(payload);

    setLoading(false);

    if (result.error) {
      setError(translateActionError(result.error, dict));
    } else {
      onSuccess();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fade-in-up" style={{ animationDuration: "0.25s" }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center",
              mode === "create" ? "bg-accent/10 text-accent" : "bg-secondary/10 text-secondary"
            )}>
              {mode === "create" ? <Plus size={18} /> : <Pencil size={18} />}
            </div>
            <h2 className="text-lg font-bold text-slate-800 font-heading">
              {mode === "create" ? (tb.addTitle || "Add Beneficiary") : (tb.editTitle || "Edit Beneficiary")}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={20} />
          </button>
        </div>

        {error && (
          <Alert variant="danger" className="mb-5">
            <XCircle size={14} className="flex-shrink-0" />{error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={tb.name || "Beneficiary Name"}
            placeholder={dict.txnProgress?.recipientPlaceholder || "Full name of the recipient"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={tb.bankName || "Bank Name"}
              placeholder={tb.bankPlaceholder || "e.g., Chase Bank"}
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              required
            />
            <Input
              label={tb.accountNumber || "Account Number"}
              placeholder={tb.accountPlaceholder || "Recipient's account number"}
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={tb.swift || "SWIFT / BIC Code"}
              placeholder={tb.swiftPlaceholder || "Optional"}
              value={swift}
              onChange={(e) => setSwift(e.target.value.toUpperCase())}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{tb.country || "Country"}</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
              >
                <option value="">{tb.selectCountry || "Select country"}</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading} className="flex-1">
              {mode === "create" ? (
                <><Plus size={16} /> {tb.addBtn || "Add Beneficiary"}</>
              ) : (
                <><CheckCircle size={16} /> {tb.saveChanges || "Save Changes"}</>
              )}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>{tc.cancel || "Cancel"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
