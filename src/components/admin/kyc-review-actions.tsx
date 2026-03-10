"use client";

import { useState } from "react";
import { approveKyc, rejectKyc } from "@/actions/kyc";
import { Button } from "@/components/ui/button";
import { Textarea, Alert } from "@/components/ui/index";
import { CheckCircle, XCircle, X } from "lucide-react";

interface Props {
  kycId: string;
  userName: string;
}

export function KycReviewActions({ kycId, userName }: Props) {
  const [showReject, setShowReject] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);

  async function handleApprove() {
    setLoading("approve");
    setError("");
    const result = await approveKyc(kycId);
    setLoading(null);
    if (result.error) setError(result.error);
    else setDone("approved");
  }

  async function handleReject() {
    if (!rejectionReason.trim() || rejectionReason.trim().length < 5) {
      setError("Veuillez fournir un motif de rejet (min. 5 caractères)");
      return;
    }
    setLoading("reject");
    setError("");
    const result = await rejectKyc(kycId, rejectionReason.trim());
    setLoading(null);
    if (result.error) setError(result.error);
    else setDone("rejected");
  }

  if (done) {
    return (
      <Alert variant={done === "approved" ? "success" : "danger"}>
        {done === "approved" ? <CheckCircle size={18} /> : <XCircle size={18} />}
        <span>
          Le KYC de <strong>{userName}</strong> a été {done === "approved" ? "approuvé" : "rejeté"}.
        </span>
      </Alert>
    );
  }

  return (
    <div>
      {error && (
        <Alert variant="danger" className="mb-4">
          <XCircle size={16} className="flex-shrink-0" />{error}
        </Alert>
      )}

      {showReject ? (
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700">Rejeter le KYC de {userName}</h4>
            <button onClick={() => { setShowReject(false); setError(""); }} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>
          <Textarea
            label="Motif de rejet"
            placeholder="Expliquez pourquoi la vérification a été rejetée afin que l'utilisateur puisse soumettre à nouveau..."
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
          <div className="flex gap-3">
            <Button variant="danger" onClick={handleReject} loading={loading === "reject"} size="sm">
              Confirmer le rejet
            </Button>
            <Button variant="ghost" onClick={() => setShowReject(false)} size="sm">Annuler</Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
          <Button variant="accent" onClick={handleApprove} loading={loading === "approve"} size="sm">
            <CheckCircle size={16} /> Approuver
          </Button>
          <Button variant="ghost" onClick={() => setShowReject(true)} size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
            <XCircle size={16} /> Rejeter
          </Button>
        </div>
      )}
    </div>
  );
}
