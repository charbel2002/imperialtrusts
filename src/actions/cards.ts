"use server";

import { getServerSession } from "next-auth";
import { getAdminSession } from "@/lib/admin-session";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCardNumber, generateCVV, generateReference } from "@/lib/utils";
import { fundCardSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import {
  sendCardCreatedEmail,
  sendCardCancelledEmail,
  sendCardFreezeToggleEmail,
} from "@/lib/email";

// --- Client: Create Card ------------------------------------

export async function createCard(cardType: "VISA" | "MASTERCARD") {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  // Check KYC
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { kycDocument: true, account: true },
  });

  if (!user) return { error: "User not found" };

  // Check if KYC is required
  const kycSetting = await prisma.systemSetting.findUnique({
    where: { key: "kyc_required" },
  });
  const kycRequired = kycSetting?.value !== "false";

  if (kycRequired && user.kycDocument?.status !== "APPROVED") {
    return { error: "KYC verification required to create cards" };
  }

  if (user.account?.status !== "ACTIVE") {
    return { error: "Your account must be active to create cards" };
  }

  // Generate card details
  const cardNumber = generateCardNumber(cardType);
  const cvv = generateCVV();
  const expirationDate = new Date();
  expirationDate.setFullYear(expirationDate.getFullYear() + 4);

  const card = await prisma.card.create({
    data: {
      userId: session.user.id,
      cardNumber,
      cardType,
      expirationDate,
      cvv,
      balance: 0,
      status: "ACTIVE",
    },
  });

  await prisma.notification.create({
    data: {
      userId: session.user.id,
      title: "New Card Created",
      message: `Your virtual ${cardType} card ending in ${cardNumber.slice(-4)} has been created successfully.`,
      type: "success",
    },
  });

  // Email the user
  await sendCardCreatedEmail({
    to: session.user.email!,
    cardType,
    lastFour: cardNumber.slice(-4),
    lang: user.language,
  });

  revalidatePath("/dashboard/cards");
  return { success: true, cardId: card.id };
}

// --- Client: Freeze Card ------------------------------------

export async function freezeCard(cardId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  const card = await prisma.card.findFirst({
    where: { id: cardId, userId: session.user.id },
  });

  if (!card) return { error: "Card not found" };
  if (card.status !== "ACTIVE") return { error: "Card is not active" };

  await prisma.card.update({
    where: { id: cardId },
    data: { status: "FROZEN" },
  });

  revalidatePath("/dashboard/cards");
  return { success: true };
}

// --- Client: Unfreeze Card ----------------------------------

export async function unfreezeCard(cardId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  const card = await prisma.card.findFirst({
    where: { id: cardId, userId: session.user.id },
  });

  if (!card) return { error: "Card not found" };
  if (card.status !== "FROZEN") return { error: "Card is not frozen" };

  await prisma.card.update({
    where: { id: cardId },
    data: { status: "ACTIVE" },
  });

  revalidatePath("/dashboard/cards");
  return { success: true };
}

// --- Client: Fund Card from Account -------------------------

export async function fundCard(data: { cardId: string; amount: number }) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  const validated = fundCardSchema.safeParse(data);
  if (!validated.success) return { error: validated.error.errors[0].message };

  const card = await prisma.card.findFirst({
    where: { id: data.cardId, userId: session.user.id },
  });
  if (!card) return { error: "Card not found" };
  if (card.status !== "ACTIVE") return { error: "Card must be active to fund" };

  const account = await prisma.account.findUnique({
    where: { userId: session.user.id },
  });
  if (!account) return { error: "No bank account found" };
  if (account.status !== "ACTIVE") return { error: "Your bank account must be active" };
  if (Number(account.balance) < data.amount) {
    return { error: `Insufficient balance. Available: $${Number(account.balance).toFixed(2)}` };
  }

  await prisma.$transaction([
    prisma.account.update({
      where: { id: account.id },
      data: { balance: { decrement: data.amount } },
    }),
    prisma.card.update({
      where: { id: data.cardId },
      data: { balance: { increment: data.amount } },
    }),
    prisma.transaction.create({
      data: {
        userId: session.user.id,
        accountId: account.id,
        type: "CARD_TRANSFER",
        amount: data.amount,
        currency: account.currency,
        description: `Fund card ending in ${card.cardNumber.slice(-4)}`,
        reference: generateReference(),
        status: "COMPLETED",
        processedAt: new Date(),
      },
    }),
  ]);

  revalidatePath("/dashboard/cards");
  revalidatePath("/dashboard");
  return { success: true };
}

// --- Client: Withdraw from Card to Account ------------------

export async function withdrawFromCard(data: { cardId: string; amount: number }) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  const card = await prisma.card.findFirst({
    where: { id: data.cardId, userId: session.user.id },
  });
  if (!card) return { error: "Card not found" };
  if (card.status !== "ACTIVE") return { error: "Card must be active" };
  if (Number(card.balance) < data.amount) {
    return { error: `Insufficient card balance. Available: $${Number(card.balance).toFixed(2)}` };
  }

  const account = await prisma.account.findUnique({
    where: { userId: session.user.id },
  });
  if (!account) return { error: "No bank account found" };

  await prisma.$transaction([
    prisma.card.update({
      where: { id: data.cardId },
      data: { balance: { decrement: data.amount } },
    }),
    prisma.account.update({
      where: { id: account.id },
      data: { balance: { increment: data.amount } },
    }),
    prisma.transaction.create({
      data: {
        userId: session.user.id,
        accountId: account.id,
        type: "CARD_TRANSFER",
        amount: data.amount,
        currency: account.currency,
        description: `Withdraw from card ending in ${card.cardNumber.slice(-4)} to account`,
        reference: generateReference(),
        status: "COMPLETED",
        processedAt: new Date(),
      },
    }),
  ]);

  revalidatePath("/dashboard/cards");
  revalidatePath("/dashboard");
  return { success: true };
}

// --- Admin: Cancel Card -------------------------------------

export async function adminCancelCard(cardId: string) {
  const session = await getAdminSession();
  if (!session) return { error: "Unauthorized" };

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { user: { select: { id: true, name: true, email: true, language: true } } },
  });
  if (!card) return { error: "Card not found" };
  if (card.status === "CANCELLED") return { error: "Card is already cancelled" };

  // If card has balance, return it to account
  const cardBalance = Number(card.balance);
  const operations: any[] = [
    prisma.card.update({
      where: { id: cardId },
      data: { status: "CANCELLED", balance: 0 },
    }),
  ];

  if (cardBalance > 0) {
    const account = await prisma.account.findUnique({ where: { userId: card.userId } });
    if (account) {
      operations.push(
        prisma.account.update({
          where: { id: account.id },
          data: { balance: { increment: cardBalance } },
        })
      );
    }
  }

  operations.push(
    prisma.notification.create({
      data: {
        userId: card.user.id,
        title: "Card Cancelled",
        message: `Your ${card.cardType} card ending in ${card.cardNumber.slice(-4)} has been cancelled by an administrator.${cardBalance > 0 ? ` $${cardBalance.toFixed(2)} has been returned to your account.` : ""}`,
        type: "danger",
      },
    }),
    prisma.adminLog.create({
      data: {
        adminId: session.user.id,
        action: "CARD_CANCELLED",
        targetType: "Card",
        targetId: cardId,
        description: `Cancelled ${card.cardType} card ending in ${card.cardNumber.slice(-4)} for ${card.user.name}`,
      },
    })
  );

  await prisma.$transaction(operations);

  // Email the user about cancellation
  await sendCardCancelledEmail({
    to: card.user.email,
    cardType: card.cardType,
    lastFour: card.cardNumber.slice(-4),
    balanceReturned: cardBalance > 0 ? `$${cardBalance.toFixed(2)}` : null,
    lang: card.user.language,
  });

  revalidatePath("/admin/cards");
  return { success: true };
}

// --- Admin: Freeze/Unfreeze Card ----------------------------

export async function adminToggleCardFreeze(cardId: string) {
  const session = await getAdminSession();
  if (!session) return { error: "Unauthorized" };

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { user: { select: { id: true, name: true, email: true, language: true } } },
  });
  if (!card) return { error: "Card not found" };

  const newStatus = card.status === "FROZEN" ? "ACTIVE" : "FROZEN";
  if (card.status === "CANCELLED" || card.status === "EXPIRED") {
    return { error: `Cannot modify a ${card.status.toLowerCase()} card` };
  }

  await prisma.card.update({
    where: { id: cardId },
    data: { status: newStatus },
  });

  await prisma.notification.create({
    data: {
      userId: card.user.id,
      title: newStatus === "FROZEN" ? "Card Frozen" : "Card Unfrozen",
      message: `Your ${card.cardType} card ending in ${card.cardNumber.slice(-4)} has been ${newStatus === "FROZEN" ? "frozen" : "reactivated"} by an administrator.`,
      type: newStatus === "FROZEN" ? "warning" : "success",
    },
  });

  await prisma.adminLog.create({
    data: {
      adminId: session.user.id,
      action: `CARD_${newStatus}`,
      targetType: "Card",
      targetId: cardId,
      description: `${newStatus === "FROZEN" ? "Froze" : "Unfroze"} ${card.cardType} card for ${card.user.name}`,
    },
  });

  // Email the user about freeze/unfreeze
  await sendCardFreezeToggleEmail({
    to: card.user.email,
    cardType: card.cardType,
    lastFour: card.cardNumber.slice(-4),
    frozen: newStatus === "FROZEN",
    lang: card.user.language,
  });

  revalidatePath("/admin/cards");
  return { success: true, newStatus };
}
