"use server";

import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { generateAccountNumber } from "@/lib/utils";

export async function registerUser(formData: FormData) {
  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const language = (formData.get("language") as string) || "en";

  const validated = registerSchema.safeParse(raw);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  const { name, email, password } = validated.data;

  // Check duplicate
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const hashedPassword = await hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "CLIENT",
      language,
      isActive: true,
      account: {
        create: {
          accountNumber: generateAccountNumber(),
          balance: 0,
          currency: "USD",
          status: "ACTIVE",
        },
      },
    },
  });

  // Create welcome notification
  await prisma.notification.create({
    data: {
      userId: user.id,
      title: "Welcome to BankVault",
      message:
        "Your account has been created successfully. Complete your KYC verification to unlock all features.",
      type: "success",
    },
  });

  return { success: true };
}
