"use client";

import { useState } from "react";
import { toggleUserActive } from "@/actions/accounts";
import { Button } from "@/components/ui/button";
import { UserX, UserCheck } from "lucide-react";

interface Props {
  userId: string;
  isActive: boolean;
  userName: string;
}

export function UserToggleActive({ userId, isActive, userName }: Props) {
  const [active, setActive] = useState(isActive);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    const action = active ? "désactiver" : "activer";
    if (!confirm(`Êtes-vous sûr de vouloir ${action} le compte de ${userName} ?`)) return;

    setLoading(true);
    const result = await toggleUserActive(userId);
    setLoading(false);

    if (result.success) {
      setActive(result.isActive!);
    }
  }

  return (
    <Button
      variant={active ? "ghost" : "accent"}
      size="sm"
      onClick={handleToggle}
      loading={loading}
      className={active ? "text-red-500 hover:bg-red-50 hover:text-red-600" : ""}
    >
      {active ? <><UserX size={16} /> Désactiver l&apos;utilisateur</> : <><UserCheck size={16} /> Activer l&apos;utilisateur</>}
    </Button>
  );
}
