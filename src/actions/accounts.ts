"use server";

import { getServerSession } from "next-auth";
import { getAdminSession } from "@/lib/admin-session";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminCreditDebitSchema } from "@/lib/validations";
import { generateReference } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { AccountStatus } from "@prisma/client";
import {
  sendAccountStatusEmail,
  sendAccountCreditedEmail,
  sendAccountDebitedEmail,
} from "@/lib/email";

// --- Admin: Set Account Status (Lock / Unlock / Suspend) --

export async function setAccountStatus(
  accountId: string,
  status: "ACTIVE" | "LOCKED" | "SUSPENDED"
) {
  const session = await getAdminSession();
  if (!session) return { error: "Unauthorized" };

  const account = await prisma.account.findUnique({
    where: { id: accountId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  if (!account) return { error: "Account not found" };

  if (account.status === status) {
    return { error: `Account is already ${status.toLowerCase()}` };
  }

  const previousStatus = account.status;

  await prisma.account.update({
    where: { id: accountId },
    data: { status: status as AccountStatus },
  });

  // Notification messages per status
  const messages: Record<string, { title: string; message: string; type: string }> = {
    LOCKED: {
      title: "Account Locked",
      message:
        "Your bank account has been locked by an administrator. You will not be able to perform transactions until your account is unlocked. Please contact support for assistance.",
      type: "danger",
    },
    SUSPENDED: {
      title: "Account Suspended",
      message:
        "Your bank account has been suspended pending review. All account operations are temporarily disabled. Please contact support for more information.",
      type: "danger",
    },
    ACTIVE: {
      title: "Account Activated",
      message:
        "Your bank account has been reactivated. You can now perform transactions and access all account features normally.",
      type: "success",
    },
  };

  const msg = messages[status];

  // Notify user
  await prisma.notification.create({
    data: {
      userId: account.user.id,
      title: msg.title,
      message: msg.message,
      type: msg.type,
    },
  });

  // Admin log
  await prisma.adminLog.create({
    data: {
      adminId: session.user.id,
      action: `ACCOUNT_${status}`,
      targetType: "Account",
      targetId: accountId,
      description: `Changed account status from ${previousStatus} to ${status} for ${account.user.name} (${account.user.email})`,
      metadata: {
        previousStatus,
        newStatus: status,
        accountNumber: account.accountNumber,
      },
    },
  });

  // Email the user about account status change
  await sendAccountStatusEmail({
    to: account.user.email,
    name: account.user.name ?? "Customer",
    status,
  });

  revalidatePath("/admin/users");
  revalidatePath("/dashboard");
  return { success: true };
}

// --- Admin: Credit Account ---------------------------------

export async function adminCreditAccount(data: {
  accountId: string;
  amount: number;
  description: string;
}) {
  const session = await getAdminSession();
  if (!session) return { error: "Unauthorized" };

  const validated = adminCreditDebitSchema.safeParse({ ...data, type: "credit" });
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  const account = await prisma.account.findUnique({
    where: { id: data.accountId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  if (!account) return { error: "Account not found" };

  // Credit: update balance + create completed transaction
  await prisma.$transaction([
    prisma.account.update({
      where: { id: data.accountId },
      data: { balance: { increment: data.amount } },
    }),
    prisma.transaction.create({
      data: {
        userId: account.user.id,
        accountId: data.accountId,
        type: "ADMIN_CREDIT",
        amount: data.amount,
        currency: account.currency,
        description: data.description,
        reference: generateReference(),
        status: "COMPLETED",
        adminNote: `Credited by admin ${session.user.name} (${session.user.email})`,
        processedAt: new Date(),
      },
    }),
    prisma.notification.create({
      data: {
        userId: account.user.id,
        title: "Account Credited",
        message: `Your account has been credited $${data.amount.toFixed(2)}. Reason: ${data.description}`,
        type: "success",
      },
    }),
    prisma.adminLog.create({
      data: {
        adminId: session.user.id,
        action: "ADMIN_CREDIT",
        targetType: "Account",
        targetId: data.accountId,
        description: `Credited $${data.amount.toFixed(2)} to ${account.user.name} (${account.accountNumber}). Reason: ${data.description}`,
        metadata: { amount: data.amount, description: data.description },
      },
    }),
  ]);

  // Email the user about the credit
  await sendAccountCreditedEmail({
    to: account.user.email,
    name: account.user.name ?? "Customer",
    amount: `$${data.amount.toFixed(2)}`,
    description: data.description,
  });

  revalidatePath("/admin/users");
  revalidatePath("/dashboard");
  return { success: true };
}

// --- Admin: Debit Account ----------------------------------

export async function adminDebitAccount(data: {
  accountId: string;
  amount: number;
  description: string;
}) {
  const session = await getAdminSession();
  if (!session) return { error: "Unauthorized" };

  const validated = adminCreditDebitSchema.safeParse({ ...data, type: "debit" });
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  const account = await prisma.account.findUnique({
    where: { id: data.accountId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  if (!account) return { error: "Account not found" };

  if (Number(account.balance) < data.amount) {
    return { error: `Insufficient balance. Current balance: $${Number(account.balance).toFixed(2)}` };
  }

  await prisma.$transaction([
    prisma.account.update({
      where: { id: data.accountId },
      data: { balance: { decrement: data.amount } },
    }),
    prisma.transaction.create({
      data: {
        userId: account.user.id,
        accountId: data.accountId,
        type: "ADMIN_DEBIT",
        amount: data.amount,
        currency: account.currency,
        description: data.description,
        reference: generateReference(),
        status: "COMPLETED",
        adminNote: `Debited by admin ${session.user.name} (${session.user.email})`,
        processedAt: new Date(),
      },
    }),
    prisma.notification.create({
      data: {
        userId: account.user.id,
        title: "Account Debited",
        message: `Your account has been debited $${data.amount.toFixed(2)}. Reason: ${data.description}`,
        type: "warning",
      },
    }),
    prisma.adminLog.create({
      data: {
        adminId: session.user.id,
        action: "ADMIN_DEBIT",
        targetType: "Account",
        targetId: data.accountId,
        description: `Debited $${data.amount.toFixed(2)} from ${account.user.name} (${account.accountNumber}). Reason: ${data.description}`,
        metadata: { amount: data.amount, description: data.description },
      },
    }),
  ]);

  // Email the user about the debit
  await sendAccountDebitedEmail({
    to: account.user.email,
    name: account.user.name ?? "Customer",
    amount: `$${data.amount.toFixed(2)}`,
    description: data.description,
  });

  revalidatePath("/admin/users");
  revalidatePath("/dashboard");
  return { success: true };
}

// --- Admin: Toggle User Active Status ----------------------

export async function toggleUserActive(userId: string) {
  const session = await getAdminSession();
  if (!session) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found" };
  if (user.role === "ADMIN") return { error: "Cannot deactivate admin accounts" };

  const newStatus = !user.isActive;

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: newStatus },
  });

  await prisma.adminLog.create({
    data: {
      adminId: session.user.id,
      action: newStatus ? "USER_ACTIVATED" : "USER_DEACTIVATED",
      targetType: "User",
      targetId: userId,
      description: `${newStatus ? "Activated" : "Deactivated"} user ${user.name} (${user.email})`,
    },
  });

  revalidatePath("/admin/users");
  return { success: true, isActive: newStatus };
}

// --- Admin: Update User Language ----------------------------

export async function updateUserLanguage(userId: string, language: string) {
  const session = await getAdminSession();
  if (!session) return { error: "Unauthorized" };

  const validLangs = ["en", "fr", "de", "es", "it", "hi", "sk", "pt", "ro", "cz"];
  if (!validLangs.includes(language)) return { error: "Invalid language" };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found" };

  await prisma.user.update({ where: { id: userId }, data: { language } });

  await prisma.adminLog.create({
    data: {
      adminId: session.user.id,
      action: "USER_LANGUAGE_CHANGED",
      targetType: "User",
      targetId: userId,
      description: `Changed language for ${user.name} from ${user.language} to ${language}`,
    },
  });

  revalidatePath("/admin/users");
  return { success: true };
}
