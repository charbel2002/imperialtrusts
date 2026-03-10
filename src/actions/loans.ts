"use server";

import { getServerSession } from "next-auth";
import { getAdminSession } from "@/lib/admin-session";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loanApplicationSchema } from "@/lib/validations";
import { calculateMonthlyPayment } from "@/lib/utils";
import {
  sendLoanApplicationConfirmation,
  sendLoanApplicationAdminNotice,
  sendLoanApprovedEmail,
  sendLoanRejectedEmail,
} from "@/lib/email";
import { revalidatePath } from "next/cache";

export async function submitLoanApplication(data: {
  email: string;
  phone: string;
  amount: number;
  durationMonths: number;
  interestRate: number;
  locale?: string;
}) {
  const validated = loanApplicationSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  const { email, phone, amount, durationMonths, interestRate } = validated.data;

  const monthlyPayment = calculateMonthlyPayment(amount, durationMonths, interestRate);
  const totalRepayment = monthlyPayment * durationMonths;

  await prisma.loanApplication.create({
    data: {
      email,
      phone,
      amount,
      durationMonths,
      interestRate,
      monthlyPayment,
      totalRepayment,
      status: "PENDING",
    },
  });

  // Send confirmation email to the applicant
  await sendLoanApplicationConfirmation({
    to: email,
    amount,
    durationMonths,
    interestRate,
    monthlyPayment,
    totalRepayment,
    lang: data.locale,
  });

  // Notify admin about the new application
  await sendLoanApplicationAdminNotice({
    applicantEmail: email,
    applicantPhone: phone,
    amount,
    durationMonths,
  });

  return { success: true };
}

// --- Admin: Approve Loan ------------------------------------

export async function adminApproveLoan(loanId: string, disburse: boolean) {
  const session = await getAdminSession();
  if (!session) return { error: "Unauthorized" };

  const loan = await prisma.loanApplication.findUnique({
    where: { id: loanId },
    include: { user: { include: { account: true } } },
  });

  if (!loan) return { error: "Loan application not found" };
  if (loan.status !== "PENDING") return { error: "Only pending loans can be approved" };

  const ops: any[] = [
    prisma.loanApplication.update({
      where: { id: loanId },
      data: { status: "APPROVED", adminNote: `Approved by ${session.user.name}${disburse ? " - funds disbursed" : ""}` },
    }),
    prisma.adminLog.create({
      data: {
        adminId: session.user.id,
        action: "LOAN_APPROVED",
        targetType: "LoanApplication",
        targetId: loanId,
        description: `Approved loan of $${Number(loan.amount).toFixed(2)} for ${loan.email}${disburse ? " with disbursement" : ""}`,
      },
    }),
  ];

  // If user exists and disburse is requested, credit their account
  if (disburse && loan.user?.account) {
    ops.push(
      prisma.account.update({
        where: { id: loan.user.account.id },
        data: { balance: { increment: Number(loan.amount) } },
      }),
      prisma.transaction.create({
        data: {
          userId: loan.user.id,
          accountId: loan.user.account.id,
          type: "LOAN_DISBURSEMENT",
          amount: Number(loan.amount),
          currency: loan.user.account.currency,
          description: `Loan disbursement - ${Number(loan.durationMonths)} months at ${Number(loan.interestRate)}%`,
          reference: `LOAN-${Date.now().toString(36).toUpperCase()}`,
          status: "COMPLETED",
          processedAt: new Date(),
        },
      }),
      prisma.notification.create({
        data: {
          userId: loan.user.id,
          title: "Loan Approved & Disbursed",
          message: `Your loan of $${Number(loan.amount).toFixed(2)} has been approved and disbursed to your account. Monthly payment: $${Number(loan.monthlyPayment).toFixed(2)} for ${loan.durationMonths} months.`,
          type: "success",
        },
      })
    );
  } else if (loan.userId) {
    ops.push(
      prisma.notification.create({
        data: {
          userId: loan.userId,
          title: "Loan Approved",
          message: `Your loan application of $${Number(loan.amount).toFixed(2)} has been approved.`,
          type: "success",
        },
      })
    );
  }

  await prisma.$transaction(ops);

  // Email the applicant about the approval
  await sendLoanApprovedEmail({
    to: loan.email,
    amount: Number(loan.amount),
    durationMonths: loan.durationMonths,
    monthlyPayment: Number(loan.monthlyPayment),
    disbursed: disburse && !!loan.user?.account,
    lang: loan.user?.language,
  });

  revalidatePath("/admin/loans");
  return { success: true };
}

// --- Admin: Reject Loan -------------------------------------

export async function adminRejectLoan(loanId: string, reason: string) {
  const session = await getAdminSession();
  if (!session) return { error: "Unauthorized" };

  if (!reason || reason.trim().length < 3) return { error: "Rejection reason is required" };

  const loan = await prisma.loanApplication.findUnique({
    where: { id: loanId },
    include: { user: { select: { language: true } } },
  });

  if (!loan) return { error: "Loan application not found" };
  if (loan.status !== "PENDING") return { error: "Only pending loans can be rejected" };

  const ops: any[] = [
    prisma.loanApplication.update({
      where: { id: loanId },
      data: { status: "REJECTED", adminNote: reason.trim() },
    }),
    prisma.adminLog.create({
      data: {
        adminId: session.user.id,
        action: "LOAN_REJECTED",
        targetType: "LoanApplication",
        targetId: loanId,
        description: `Rejected loan of $${Number(loan.amount).toFixed(2)} for ${loan.email}. Reason: ${reason.trim()}`,
      },
    }),
  ];

  if (loan.userId) {
    ops.push(
      prisma.notification.create({
        data: {
          userId: loan.userId,
          title: "Loan Application Rejected",
          message: `Your loan application of $${Number(loan.amount).toFixed(2)} was rejected. Reason: ${reason.trim()}`,
          type: "danger",
        },
      })
    );
  }

  await prisma.$transaction(ops);

  // Email the applicant about the rejection
  await sendLoanRejectedEmail({
    to: loan.email,
    amount: Number(loan.amount),
    reason: reason.trim(),
    lang: loan.user?.language,
  });

  revalidatePath("/admin/loans");
  return { success: true };
}
