"use client";

import { useDict } from "@/components/shared/dict-provider";
import { useState } from "react";
import { BeneficiaryFormModal } from "./beneficiary-form-modal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function AddBeneficiaryButton() {
  const dict = useDict();
  const tb = (dict.beneficiariesPage || {}) as any;
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus size={16} /> {tb.addBtn || "Add Beneficiary"}
      </Button>

      {open && (
        <BeneficiaryFormModal
          mode="create"
          onClose={() => setOpen(false)}
          onSuccess={() => setOpen(false)}
        />
      )}
    </>
  );
}
