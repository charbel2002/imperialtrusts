"use server";

import { getServerSession } from "next-auth";
import { getAdminSession } from "@/lib/admin-session";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/lib/dictionary";
import { getPlatformSettings } from "@/lib/platform";
import { transferSchema } from "@/lib/validations";
import { generateReference } from "@/lib/utils";
import {
  sendTransferInitiatedEmail,
  sendTransferApprovedEmail,
  sendTransferRejectedEmail,
  sendTransferCompletedEmail,
} from "@/lib/email";
import { revalidatePath } from "next/cache";


// --- Helper: Get notification text in user's language --------

async function getNotifDict(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { language: true } });
  const lang = (user?.language || "en") as any;
  const platform = await getPlatformSettings();
  const dict = await getDictionary(lang, platform);
  return dict.notifications || {};
}

// --- Client: Initiate Transfer ------------------------------

export async function initiateTransfer(data: {
  beneficiaryId: string;
  amount: number;
  description?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  const validated = transferSchema.safeParse(data);
  if (!validated.success) return { error: validated.error.errors[0].message };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { account: true, kycDocument: true },
  });

  if (!user) return { error: "User not found" };
  const kycSetting = await prisma.systemSetting.findUnique({ where: { key: "kyc_required" } });
  if (kycSetting?.value !== "false" && user.kycDocument?.status !== "APPROVED") {
    return { error: "KYC verification required to send funds" };
  }
  if (!user.account || user.account.status !== "ACTIVE") {
    return { error: "Your account must be active to send transfers" };
  }
  if (Number(user.account.balance) < data.amount) {
    return { error: `Insufficient balance. Available: $${Number(user.account.balance).toFixed(2)}` };
  }

  const beneficiary = await prisma.beneficiary.findFirst({
    where: { id: data.beneficiaryId, userId: session.user.id },
  });
  if (!beneficiary) return { error: "Beneficiary not found" };

  const transaction = await prisma.transaction.create({
    data: {
      userId: session.user.id,
      accountId: user.account.id,
      beneficiaryId: data.beneficiaryId,
      type: "TRANSFER",
      amount: data.amount,
      currency: user.account.currency,
      description: data.description || `Transfer to ${beneficiary.name}`,
      reference: generateReference(),
      status: "PENDING",
    },
  });

  const nd1 = await getNotifDict(session.user.id);
  await prisma.notification.create({
    data: {
      userId: session.user.id,
      title: nd1.transferInitiated || "Transfer Initiated",
      message: (nd1.transferInitiatedMsg || "Your transfer of {{amount}} to {{name}} has been submitted. Reference: {{ref}}")
        .replace("{{amount}}", `$${data.amount.toFixed(2)}`).replace("{{name}}", beneficiary.name).replace("{{ref}}", transaction.reference),
      type: "info",
    },
  });

  // Email the user
  await sendTransferInitiatedEmail({
    to: session.user.email!,
    amount: `$${data.amount.toFixed(2)}`,
    beneficiaryName: beneficiary.name,
    reference: transaction.reference,
  });

  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/transfers");
  revalidatePath("/dashboard");
  return { success: true, reference: transaction.reference, transactionId: transaction.id };
}

// --- Client: Cancel Transaction -----------------------------

export async function cancelTransaction(transactionId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };
  const txn = await prisma.transaction.findFirst({ where: { id: transactionId, userId: session.user.id } });
  if (!txn) return { error: "Transaction not found" };
  if (!["INITIALIZED", "PENDING"].includes(txn.status)) return { error: "Only pending transactions can be cancelled" };
  await prisma.transaction.update({ where: { id: transactionId }, data: { status: "CANCELLED" } });
  revalidatePath("/dashboard/transactions");
  return { success: true };
}

// --- Client: Resolve a Lock (enter security code) -----------

export async function resolveTransactionLock(lockId: string, code: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  const lock = await prisma.transactionLock.findUnique({
    where: { id: lockId },
    include: { transaction: true },
  });
  if (!lock) return { error: "Lock not found" };
  if (lock.transaction.userId !== session.user.id) return { error: "Unauthorized" };
  if (lock.isResolved) return { error: "Already resolved" };
  if (lock.securityCode !== code.trim()) return { error: "Invalid security code" };

  await prisma.transactionLock.update({
    where: { id: lockId },
    data: { isResolved: true, resolvedAt: new Date() },
  });

  revalidatePath("/dashboard/transactions");
  return { success: true };
}

// --- Client: Complete Transaction (progress bar reached 100%) --

export async function completeTransaction(transactionId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  const txn = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { locks: true, account: true, beneficiary: true },
  });
  if (!txn) return { error: "Transaction not found" };
  if (txn.userId !== session.user.id) return { error: "Unauthorized" };
  if (txn.status !== "PROCESSING") return { error: "Transaction is not processing" };

  const unresolved = txn.locks.filter((l) => !l.isResolved);
  if (unresolved.length > 0) return { error: "All security locks must be resolved first" };
  if (Number(txn.account.balance) < Number(txn.amount)) return { error: "Insufficient balance" };

  const nd2 = await getNotifDict(txn.userId);
  await prisma.$transaction([
    prisma.account.update({ where: { id: txn.accountId }, data: { balance: { decrement: Number(txn.amount) } } }),
    prisma.transaction.update({ where: { id: transactionId }, data: { status: "COMPLETED", processedAt: new Date() } }),
    prisma.notification.create({
      data: {
        userId: txn.userId,
        title: nd2.transferCompleted || "Transfer Completed",
        message: (nd2.transferCompletedMsg || "Your transfer of {{amount}} to {{name}} has been completed. Reference: {{ref}}")
          .replace("{{amount}}", `$${Number(txn.amount).toFixed(2)}`).replace("{{name}}", txn.beneficiary?.name ?? "recipient").replace("{{ref}}", txn.reference),
        type: "success",
      },
    }),
  ]);

  // Email the user
  await sendTransferCompletedEmail({
    to: session.user.email!,
    amount: `$${Number(txn.amount).toFixed(2)}`,
    beneficiaryName: txn.beneficiary?.name ?? "recipient",
    reference: txn.reference,
  });

  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard");
  return { success: true };
}

// --- Fetch transaction for progress tracker -----------------

export async function getTransactionWithLocks(transactionId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  const txn = await prisma.transaction.findFirst({
    where: { id: transactionId, userId: session.user.id },
    include: { locks: { orderBy: { percentage: "asc" } }, beneficiary: { select: { name: true } } },
  });
  if (!txn) return null;
  return {
    id: txn.id, reference: txn.reference, amount: Number(txn.amount), currency: txn.currency,
    status: txn.status, progress: txn.progress, beneficiaryName: txn.beneficiary?.name ?? "Recipient", description: txn.description,
    locks: txn.locks.map((l) => ({ id: l.id, motif: l.motif, percentage: l.percentage, isResolved: l.isResolved })),
  };
}

// --- Client: Save progress (called every 5% increment) -----

export async function updateTransactionProgress(transactionId: string, progress: number) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  const txn = await prisma.transaction.findFirst({
    where: { id: transactionId, userId: session.user.id, status: "PROCESSING" },
  });
  if (!txn) return { error: "Transaction not found" };

  const clampedProgress = Math.min(Math.max(Math.round(progress), 0), 100);

  await prisma.transaction.update({
    where: { id: transactionId },
    data: { progress: clampedProgress },
  });

  return { success: true };
}

// === ADMIN ACTIONS ===========================================

export async function adminApproveTransaction(transactionId: string) {
  const session = await getAdminSession();
  if (!session) return { error: "Unauthorized" };

  const txn = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { account: true, user: true, locks: true, beneficiary: true },
  });
  if (!txn) return { error: "Transaction not found" };
  if (txn.status !== "PENDING") return { error: "Only pending transactions can be approved" };
  if (Number(txn.account.balance) < Number(txn.amount)) {
    return { error: `Insufficient balance. Available: $${Number(txn.account.balance).toFixed(2)}` };
  }

  const nd3 = await getNotifDict(txn.userId);
  const hasLocks = txn.locks.length > 0;
  const newStatus = hasLocks ? "PROCESSING" : "COMPLETED";
  const ops: any[] = [
    prisma.transaction.update({
      where: { id: transactionId },
      data: { status: newStatus, adminNote: `Approved by ${session.user.name}`, processedAt: hasLocks ? undefined : new Date() },
    }),
    prisma.notification.create({
      data: {
        userId: txn.userId,
        title: hasLocks ? (nd3.transferApprovedLocks || "Transfer Approved - Verification Required") : (nd3.transferCompleted || "Transfer Completed"),
        message: hasLocks
          ? (nd3.transferApprovedLocksMsg || "Your transfer of {{amount}} to {{name}} has been approved but requires verification. Reference: {{ref}}")
              .replace("{{amount}}", `$${Number(txn.amount).toFixed(2)}`).replace("{{name}}", txn.beneficiary?.name ?? "recipient").replace("{{ref}}", txn.reference)
          : (nd3.transferCompletedMsg || "Your transfer of {{amount}} to {{name}} has been completed. Reference: {{ref}}")
              .replace("{{amount}}", `$${Number(txn.amount).toFixed(2)}`).replace("{{name}}", txn.beneficiary?.name ?? "recipient").replace("{{ref}}", txn.reference),
        type: hasLocks ? "info" : "success",
      },
    }),
    prisma.adminLog.create({
      data: { adminId: session.user.id, action: "TRANSACTION_APPROVED", targetType: "Transaction", targetId: transactionId,
        description: `Approved transfer $${Number(txn.amount).toFixed(2)} for ${txn.user.name}. Ref: ${txn.reference}` },
    }),
  ];
  if (!hasLocks) ops.push(prisma.account.update({ where: { id: txn.accountId }, data: { balance: { decrement: Number(txn.amount) } } }));
  await prisma.$transaction(ops);

  // Email the user
  await sendTransferApprovedEmail({
    to: txn.user.email,
    amount: `$${Number(txn.amount).toFixed(2)}`,
    beneficiaryName: txn.beneficiary?.name ?? "recipient",
    reference: txn.reference,
    hasLocks,
  });

  revalidatePath("/admin/transactions");
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function adminRejectTransaction(transactionId: string, reason: string) {
  const session = await getAdminSession();
  if (!session) return { error: "Unauthorized" };
  if (!reason || reason.trim().length < 3) return { error: "Rejection reason is required" };

  const txn = await prisma.transaction.findUnique({ where: { id: transactionId }, include: { user: true, beneficiary: true } });
  if (!txn) return { error: "Transaction not found" };
  if (!["PENDING", "PROCESSING"].includes(txn.status)) return { error: "Cannot reject in current state" };

  const nd4 = await getNotifDict(txn.userId);
  await prisma.$transaction([
    prisma.transaction.update({ where: { id: transactionId }, data: { status: "REJECTED", adminNote: reason, processedAt: new Date() } }),
    prisma.notification.create({ data: { userId: txn.userId, title: nd4.transferRejected || "Transfer Rejected",
      message: (nd4.transferRejectedMsg || "Your transfer of {{amount}} to {{name}} was rejected. Reason: {{reason}}")
        .replace("{{amount}}", `$${Number(txn.amount).toFixed(2)}`).replace("{{name}}", txn.beneficiary?.name ?? "recipient").replace("{{reason}}", reason), type: "danger" } }),
    prisma.adminLog.create({ data: { adminId: session.user.id, action: "TRANSACTION_REJECTED", targetType: "Transaction", targetId: transactionId,
      description: `Rejected transfer for ${txn.user.name}. Ref: ${txn.reference}. Reason: ${reason}` } }),
  ]);

  // Email the user
  await sendTransferRejectedEmail({
    to: txn.user.email,
    amount: `$${Number(txn.amount).toFixed(2)}`,
    beneficiaryName: txn.beneficiary?.name ?? "recipient",
    reference: txn.reference,
    reason,
  });

  revalidatePath("/admin/transactions");
  revalidatePath("/dashboard/transactions");
  return { success: true };
}

export async function adminAddTransactionLock(data: {
  transactionId: string;
  motif: string;
  securityCode: string;
  percentage: number;
}) {
  const session = await getAdminSession();
  if (!session) return { error: "Unauthorized" };
  if (!data.motif.trim() || !data.securityCode.trim()) return { error: "Motif and security code are required" };
  if (data.percentage < 1 || data.percentage > 99) return { error: "Percentage must be between 1 and 99" };

  const txn = await prisma.transaction.findUnique({ where: { id: data.transactionId }, include: { user: true, locks: { select: { percentage: true } } } });
  if (!txn) return { error: "Transaction not found" };

  // New lock percentage must be greater than the highest existing lock
  const maxExisting = txn.locks.length > 0 ? Math.max(...txn.locks.map((l) => l.percentage)) : 0;
  if (data.percentage <= maxExisting) {
    return { error: `Percentage must be greater than ${maxExisting}% (highest existing lock)` };
  }

  await prisma.$transaction([
    prisma.transactionLock.create({ data: { transactionId: data.transactionId, motif: data.motif.trim(), securityCode: data.securityCode.trim(), percentage: data.percentage } }),
    prisma.adminLog.create({ data: { adminId: session.user.id, action: "TRANSACTION_LOCK_ADDED", targetType: "Transaction", targetId: data.transactionId,
      description: `Added lock at ${data.percentage}% to ${txn.reference}. Motif: ${data.motif.trim()}` } }),
  ]);

  revalidatePath("/admin/transactions");
  revalidatePath("/dashboard/transactions");
  return { success: true };
}
