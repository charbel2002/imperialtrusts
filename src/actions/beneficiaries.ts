"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { beneficiarySchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

// --- Create Beneficiary -------------------------------------

export async function createBeneficiary(data: {
  name: string;
  bankName: string;
  accountNumber: string;
  swift?: string;
  country: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  // KYC gate
  const kycSetting = await prisma.systemSetting.findUnique({ where: { key: "kyc_required" } });
  const kycRequired = kycSetting?.value !== "false";

  if (kycRequired) {
    const kyc = await prisma.kycDocument.findUnique({ where: { userId: session.user.id } });
    if (kyc?.status !== "APPROVED") {
      return { error: "KYC verification required to manage beneficiaries" };
    }
  }

  const validated = beneficiarySchema.safeParse(data);
  if (!validated.success) return { error: validated.error.errors[0].message };

  // Check for duplicate (same user, same account number + bank)
  const existing = await prisma.beneficiary.findFirst({
    where: {
      userId: session.user.id,
      accountNumber: validated.data.accountNumber,
      bankName: validated.data.bankName,
    },
  });

  if (existing) {
    return { error: "A beneficiary with this account number and bank already exists" };
  }

  await prisma.beneficiary.create({
    data: {
      userId: session.user.id,
      name: validated.data.name,
      bankName: validated.data.bankName,
      accountNumber: validated.data.accountNumber,
      swift: validated.data.swift || null,
      country: validated.data.country,
    },
  });

  revalidatePath("/dashboard/beneficiaries");
  revalidatePath("/dashboard/transfers");
  return { success: true };
}

// --- Update Beneficiary -------------------------------------

export async function updateBeneficiary(
  beneficiaryId: string,
  data: {
    name: string;
    bankName: string;
    accountNumber: string;
    swift?: string;
    country: string;
  }
) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  const beneficiary = await prisma.beneficiary.findFirst({
    where: { id: beneficiaryId, userId: session.user.id },
  });

  if (!beneficiary) return { error: "Beneficiary not found" };

  const validated = beneficiarySchema.safeParse(data);
  if (!validated.success) return { error: validated.error.errors[0].message };

  // Check duplicate excluding current
  const duplicate = await prisma.beneficiary.findFirst({
    where: {
      userId: session.user.id,
      accountNumber: validated.data.accountNumber,
      bankName: validated.data.bankName,
      id: { not: beneficiaryId },
    },
  });

  if (duplicate) {
    return { error: "Another beneficiary with this account number and bank already exists" };
  }

  await prisma.beneficiary.update({
    where: { id: beneficiaryId },
    data: {
      name: validated.data.name,
      bankName: validated.data.bankName,
      accountNumber: validated.data.accountNumber,
      swift: validated.data.swift || null,
      country: validated.data.country,
    },
  });

  revalidatePath("/dashboard/beneficiaries");
  revalidatePath("/dashboard/transfers");
  return { success: true };
}

// --- Delete Beneficiary -------------------------------------

export async function deleteBeneficiary(beneficiaryId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  const beneficiary = await prisma.beneficiary.findFirst({
    where: { id: beneficiaryId, userId: session.user.id },
  });

  if (!beneficiary) return { error: "Beneficiary not found" };

  // Check if there are pending transactions for this beneficiary
  const pendingTxns = await prisma.transaction.count({
    where: {
      beneficiaryId,
      status: { in: ["INITIALIZED", "PENDING", "LOCKED", "PROCESSING"] },
    },
  });

  if (pendingTxns > 0) {
    return { error: "Cannot delete beneficiary with pending transactions" };
  }

  await prisma.beneficiary.delete({ where: { id: beneficiaryId } });

  revalidatePath("/dashboard/beneficiaries");
  revalidatePath("/dashboard/transfers");
  return { success: true };
}
