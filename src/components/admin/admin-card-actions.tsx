"use client";

import { useState } from "react";
import { adminToggleCardFreeze, adminCancelCard } from "@/actions/cards";
import { Button } from "@/components/ui/button";
import { Snowflake, Sun, Trash2 } from "lucide-react";

interface Props {
  cardId: string;
  cardStatus: string;
  cardLast4: string;
  cardType: string;
  userName: string;
}

export function AdminCardActions({ cardId, cardStatus, cardLast4, cardType, userName }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState(cardStatus);

  const isActive = currentStatus === "ACTIVE";
  const isFrozen = currentStatus === "FROZEN";
  const isCancelled = currentStatus === "CANCELLED";
  const isExpired = currentStatus === "EXPIRED";
  const canModify = !isCancelled && !isExpired;

  async function handleToggleFreeze() {
    setLoading("freeze");
    const result = await adminToggleCardFreeze(cardId);
    setLoading(null);
    if (result.success && result.newStatus) {
      setCurrentStatus(result.newStatus);
    }
  }

  async function handleCancel() {
    if (!confirm(`Cancel ${cardType} card **** ${cardLast4} for ${userName}? Any remaining balance will be returned to their account.`)) return;
    setLoading("cancel");
    const result = await adminCancelCard(cardId);
    setLoading(null);
    if (result.success) setCurrentStatus("CANCELLED");
  }

  if (!canModify) {
    return <span className="text-xs text-slate-400">-</span>;
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        size="sm"
        variant="ghost"
        onClick={handleToggleFreeze}
        loading={loading === "freeze"}
        className={isActive ? "text-blue-600 hover:bg-blue-50 !px-2" : "text-emerald-600 hover:bg-emerald-50 !px-2"}
      >
        {isActive ? <Snowflake size={14} /> : <Sun size={14} />}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleCancel}
        loading={loading === "cancel"}
        className="text-red-500 hover:bg-red-50 !px-2"
      >
        <Trash2 size={14} />
      </Button>
    </div>
  );
}
