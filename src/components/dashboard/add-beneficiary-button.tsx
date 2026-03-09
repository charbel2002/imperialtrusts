"use client";


import { useState } from "react";
import { BeneficiaryFormModal } from "./beneficiary-form-modal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function AddBeneficiaryButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus size={16} /> Add Beneficiary
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
