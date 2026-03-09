import { PrismaClient, Role, AccountStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ── Admin User ──────────────────────────────
  const adminPassword = await hash("password", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@bankvault.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@bankvault.com",
      password: adminPassword,
      role: Role.ADMIN,
      language: "fr",
      isActive: true,
      emailVerifiedAt: new Date(),
      account: {
        create: {
          accountNumber: "BNK" + Math.random().toString().slice(2, 12),
          balance: 0,
          currency: "USD",
          status: AccountStatus.ACTIVE,
        },
      },
    },
  });

  // ── Demo Client ─────────────────────────────
  const clientPassword = await hash("password", 12);
  const client = await prisma.user.upsert({
    where: { email: "client@bankvault.com" },
    update: {},
    create: {
      name: "John Doe",
      email: "client@bankvault.com",
      password: clientPassword,
      role: Role.CLIENT,
      language: "en",
      isActive: true,
      emailVerifiedAt: new Date(),
      account: {
        create: {
          accountNumber: "BNK" + Math.random().toString().slice(2, 12),
          balance: 5000.0,
          currency: "USD",
          status: AccountStatus.ACTIVE,
        },
      },
    },
  });

  // ── System Settings ─────────────────────────
  const settings = [
    { key: "kyc_required", value: "true", type: "boolean" },
    { key: "platform_name", value: "BankVault", type: "string" },
    { key: "platform_tagline", value: "Modern Digital Banking", type: "string" },
    { key: "platform_logo_url", value: "/uploads/logo.png", type: "string" },
    { key: "platform_email", value: "support@bankvault.com", type: "string" },
    { key: "platform_phone", value: "+1 (800) 555-0199", type: "string" },
    { key: "platform_address", value: "350 Fifth Avenue, Suite 3200, New York, NY 10118", type: "string" },
    { key: "platform_mail_from", value: "noreply@bankvault.com", type: "string" },
    { key: "platform_mail_name", value: "BankVault Notifications", type: "string" },
    { key: "default_currency", value: "USD", type: "string" },
    { key: "transfer_fee_percentage", value: "0.5", type: "float" },
    { key: "min_transfer_amount", value: "1", type: "float" },
    { key: "max_transfer_amount", value: "50000", type: "float" },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  console.log("Seeded: admin, client, and system settings");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
