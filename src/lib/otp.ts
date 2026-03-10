import { prisma } from "@/lib/prisma";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;

/**
 * Generate a random 6-digit OTP, persist it to the database,
 * and clean up any previous tokens for that user.
 */
export async function generateOtp(userId: string): Promise<string> {
  // Delete any existing OTP tokens for this user
  await prisma.otpToken.deleteMany({ where: { userId } });

  const code = Array.from({ length: OTP_LENGTH }, () =>
    Math.floor(Math.random() * 10)
  ).join("");

  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otpToken.create({
    data: { userId, code, expiresAt },
  });

  return code;
}

/**
 * Verify a 6-digit OTP for a given user.
 * Returns `true` if valid and not expired; `false` otherwise.
 * On success the token is deleted so it cannot be reused.
 */
export async function verifyOtp(
  userId: string,
  code: string
): Promise<{ valid: boolean; reason?: "invalid" | "expired" }> {
  const token = await prisma.otpToken.findFirst({
    where: { userId, verified: false },
    orderBy: { createdAt: "desc" },
  });

  if (!token || token.code !== code) {
    return { valid: false, reason: "invalid" };
  }

  if (token.expiresAt < new Date()) {
    // Expired — clean up
    await prisma.otpToken.delete({ where: { id: token.id } });
    return { valid: false, reason: "expired" };
  }

  // Valid — delete the token so it can't be reused
  await prisma.otpToken.delete({ where: { id: token.id } });
  return { valid: true };
}
