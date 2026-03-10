"use client";

import { useState } from "react";
import { setAccountStatus } from "@/actions/accounts";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/index";
import { Lock, Unlock, ShieldOff, CheckCircle, XCircle } from "lucide-react";

interface Props {
  accountId: string;
  currentStatus: string;
  userName: string;
}

export function AccountStatusActions({ accountId, currentStatus, userName }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleStatusChange(status: "ACTIVE" | "LOCKED" | "SUSPENDED") {
    setLoading(status);
    setError("");
    setSuccess("");

    const result = await setAccountStatus(accountId, status);
    setLoading(null);

    if (result.error) {
      setError(result.error);
    } else {
      const labels = { ACTIVE: "activé", LOCKED: "verrouillé", SUSPENDED: "suspendu" };
      setSuccess(`Le compte de ${userName} a été ${labels[status]}.`);
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

      <div className="flex flex-wrap gap-3">
        {currentStatus !== "ACTIVE" && (
          <Button
            variant="accent"
            size="sm"
            onClick={() => handleStatusChange("ACTIVE")}
            loading={loading === "ACTIVE"}
          >
            <Unlock size={14} /> Activer le compte
          </Button>
        )}

        {currentStatus !== "LOCKED" && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleStatusChange("LOCKED")}
            loading={loading === "LOCKED"}
          >
            <Lock size={14} /> Verrouiller le compte
          </Button>
        )}

        {currentStatus !== "SUSPENDED" && (
          <Button
            variant="ghost"
            size="sm"
            className="text-amber-600 hover:bg-amber-50 hover:text-amber-700"
            onClick={() => handleStatusChange("SUSPENDED")}
            loading={loading === "SUSPENDED"}
          >
            <ShieldOff size={14} /> Suspendre le compte
          </Button>
        )}
      </div>

      <p className="text-xs text-slate-400 mt-3">
        {currentStatus === "LOCKED" && "Les comptes verrouillés ne peuvent effectuer aucune transaction."}
        {currentStatus === "SUSPENDED" && "Les comptes suspendus sont en cours de révision. Toutes les opérations sont désactivées."}
        {currentStatus === "ACTIVE" && "Le compte est pleinement opérationnel."}
      </p>
    </div>
  );
}
