"use server";

import { hash, compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { generateAccountNumber } from "@/lib/utils";
import { sendWelcomeEmail, sendNewUserAdminNotice, sendOtpEmail } from "@/lib/email";
import { getPlatformSettings } from "@/lib/platform";
import { generateOtp } from "@/lib/otp";

export async function registerUser(formData: FormData) {
  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const language = (formData.get("language") as string) || "en";
  const currency = (formData.get("currency") as string) || "EUR";

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
          currency: currency,
          status: "ACTIVE",
        },
      },
    },
  });

  // Create welcome notification
  const platform = await getPlatformSettings();
  await prisma.notification.create({
    data: {
      userId: user.id,
      title: `Welcome to ${platform.name}`,
      message:
        "Your account has been created successfully. Complete your KYC verification to unlock all features.",
      type: "success",
    },
  });

  // Send welcome email to user + notify admin
  await sendWelcomeEmail({ to: email, name, lang: language });
  await sendNewUserAdminNotice({ name, email });

  return { success: true };
}

// ---------------------------------------------------------------------------
// Request OTP for login  (Phase 1 of two-phase login)
// ---------------------------------------------------------------------------

export async function requestLoginOtp(email: string, password: string) {
  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return { error: "Invalid email or password" };
  }

  if (!user.isActive) {
    return { error: "Your account has been deactivated" };
  }

  const isValid = await compare(password, user.password);
  if (!isValid) {
    return { error: "Invalid email or password" };
  }

  // Admin users bypass OTP – let them sign in directly
  if (user.role === "ADMIN") {
    return { otpSent: false, isAdmin: true };
  }

  // Generate OTP and send email
  const code = await generateOtp(user.id);
  await sendOtpEmail({ to: user.email, code, lang: user.language });

  return { otpSent: true };
}
