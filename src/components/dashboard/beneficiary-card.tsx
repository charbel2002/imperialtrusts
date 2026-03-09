"use client";

import { useDict } from "@/components/shared/dict-provider";

import { useState } from "react";
import { deleteBeneficiary } from "@/actions/beneficiaries";
import { BeneficiaryFormModal } from "./beneficiary-form-modal";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/index";
import { Pencil, Trash2, Building2, Globe, Hash, XCircle } from "lucide-react";

interface BeneficiaryData {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  swift: string | null;
  country: string;
}

interface Props {
  beneficiary: BeneficiaryData;
}

export function BeneficiaryCard({ beneficiary }: Props) {
  const dict = useDict();
  const tc = dict.common || {};
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (!confirm(`Delete beneficiary "${beneficiary.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    setError("");
    const result = await deleteBeneficiary(beneficiary.id);
    setDeleting(false);
    if (result.error) setError(result.error);
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {beneficiary.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">{beneficiary.name}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <Globe size={10} /> {beneficiary.country}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowEdit(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-secondary hover:bg-blue-50 transition-colors"
                title={tc.edit || "Edit"}
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                title={tc.delete || "Delete"}
              >
                {deleting ? (
                  <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <Trash2 size={14} />
                )}
              </button>
            </div>
          </div>

          {error && (
            <Alert variant="danger" className="mb-3 !py-2 !text-xs">
              <XCircle size={12} className="flex-shrink-0" />{error}
            </Alert>
          )}

          {/* Details */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <Building2 size={14} className="text-slate-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Bank</p>
                <p className="text-xs font-medium text-slate-700 truncate">{beneficiary.bankName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Hash size={14} className="text-slate-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Account</p>
                <p className="text-xs font-mono font-medium text-slate-700 truncate">{beneficiary.accountNumber}</p>
              </div>
            </div>

            {beneficiary.swift && (
              <div className="flex items-center gap-2.5">
                <Globe size={14} className="text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">SWIFT</p>
                  <p className="text-xs font-mono font-medium text-slate-700">{beneficiary.swift}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEdit && (
        <BeneficiaryFormModal
          mode="edit"
          defaultValues={{
            id: beneficiary.id,
            name: beneficiary.name,
            bankName: beneficiary.bankName,
            accountNumber: beneficiary.accountNumber,
            swift: beneficiary.swift ?? "",
            country: beneficiary.country,
          }}
          onClose={() => setShowEdit(false)}
          onSuccess={() => setShowEdit(false)}
        />
      )}
    </>
  );
}
