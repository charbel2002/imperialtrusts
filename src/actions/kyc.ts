"use server";

import { getServerSession } from "next-auth";
import { getAdminSession } from "@/lib/admin-session";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { kycSubmissionSchema, kycReviewSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import {
  sendKycSubmittedEmail,
  sendKycSubmittedAdminNotice,
  sendKycApprovedEmail,
  sendKycRejectedEmail,
} from "@/lib/email";

// --- Client: Submit KYC ------------------------------------

export async function submitKyc(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  const raw = {
    fullLegalName: formData.get("fullLegalName") as string,
    dateOfBirth: formData.get("dateOfBirth") as string,
    address: formData.get("address") as string,
    nationalId: formData.get("nationalId") as string,
  };

  const validated = kycSubmissionSchema.safeParse(raw);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  const idDocumentPath = formData.get("idDocumentPath") as string;
  const selfiePath = formData.get("selfiePath") as string;

  if (!idDocumentPath || !selfiePath) {
    return { error: "Both ID document and selfie are required" };
  }

  // Check if user already has a KYC document
  const existing = await prisma.kycDocument.findUnique({
    where: { userId: session.user.id },
  });

  if (existing && existing.status === "APPROVED") {
    return { error: "Your KYC is already approved" };
  }

  if (existing && existing.status === "PENDING") {
    return { error: "Your KYC submission is already under review" };
  }

  const { fullLegalName, dateOfBirth, address, nationalId } = validated.data;

  // Upsert - allows resubmission after rejection
  await prisma.kycDocument.upsert({
    where: { userId: session.user.id },
    update: {
      fullLegalName,
      dateOfBirth: new Date(dateOfBirth),
      address,
      nationalId,
      idDocumentPath,
      selfiePath,
      status: "PENDING",
      rejectionReason: null,
      reviewedAt: null,
      reviewedBy: null,
    },
    create: {
      userId: session.user.id,
      fullLegalName,
      dateOfBirth: new Date(dateOfBirth),
      address,
      nationalId,
      idDocumentPath,
      selfiePath,
      status: "PENDING",
    },
  });

  // Notify user
  await prisma.notification.create({
    data: {
      userId: session.user.id,
      title: "KYC Submitted",
      message: "Your identity verification documents have been submitted and are under review. We'll notify you once the review is complete.",
      type: "info",
    },
  });

  // Email user + admin
  await sendKycSubmittedEmail({ to: session.user.email!, name: session.user.name || "User" });
  await sendKycSubmittedAdminNotice({ userName: session.user.name || "User", userEmail: session.user.email! });

  revalidatePath("/dashboard/kyc");
  return { success: true };
}

// --- Admin: Approve KYC ------------------------------------

export async function approveKyc(kycId: string) {
  const session = await getAdminSession();
  if (!session) return { error: "Unauthorized" };

  const kyc = await prisma.kycDocument.findUnique({
    where: { id: kycId },
    include: { user: true },
  });

  if (!kyc) return { error: "KYC document not found" };
  if (kyc.status === "APPROVED") return { error: "Already approved" };

  await prisma.kycDocument.update({
    where: { id: kycId },
    data: {
      status: "APPROVED",
      rejectionReason: null,
      reviewedAt: new Date(),
      reviewedBy: session.user.id,
    },
  });

  // Notify the user
  await prisma.notification.create({
    data: {
      userId: kyc.userId,
      title: "KYC Approved",
      message: "Your identity has been verified successfully. You now have full access to all banking features including transfers, cards, and beneficiary management.",
      type: "success",
    },
  });

  // Log admin action
  await prisma.adminLog.create({
    data: {
      adminId: session.user.id,
      action: "KYC_APPROVED",
      targetType: "KycDocument",
      targetId: kycId,
      description: `Approved KYC for user ${kyc.user.name} (${kyc.user.email})`,
    },
  });

  // Email the user
  await sendKycApprovedEmail({ to: kyc.user.email, name: kyc.user.name });

  revalidatePath("/admin/kyc");
  revalidatePath("/dashboard/kyc");
  return { success: true };
}

// --- Admin: Reject KYC -------------------------------------

export async function rejectKyc(kycId: string, reason: string) {
  const session = await getAdminSession();
  if (!session) return { error: "Unauthorized" };

  if (!reason || reason.trim().length < 5) {
    return { error: "A rejection reason is required (min 5 characters)" };
  }

  const kyc = await prisma.kycDocument.findUnique({
    where: { id: kycId },
    include: { user: true },
  });

  if (!kyc) return { error: "KYC document not found" };

  await prisma.kycDocument.update({
    where: { id: kycId },
    data: {
      status: "REJECTED",
      rejectionReason: reason,
      reviewedAt: new Date(),
      reviewedBy: session.user.id,
    },
  });

  // Notify the user
  await prisma.notification.create({
    data: {
      userId: kyc.userId,
      title: "KYC Rejected",
      message: `Your identity verification was not approved. Reason: ${reason}. Please review and resubmit your documents.`,
      type: "danger",
    },
  });

  // Log admin action
  await prisma.adminLog.create({
    data: {
      adminId: session.user.id,
      action: "KYC_REJECTED",
      targetType: "KycDocument",
      targetId: kycId,
      description: `Rejected KYC for user ${kyc.user.name} (${kyc.user.email}). Reason: ${reason}`,
    },
  });

  // Email the user
  await sendKycRejectedEmail({ to: kyc.user.email, name: kyc.user.name, reason });

  revalidatePath("/admin/kyc");
  revalidatePath("/dashboard/kyc");
  return { success: true };
}
