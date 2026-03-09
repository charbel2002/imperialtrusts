import { prisma } from "@/lib/prisma";

export interface PlatformSettings {
  name: string;
  tagline: string;
  logoUrl: string;
  email: string;
  phone: string;
  address: string;
  mailFrom: string;
  mailName: string;
}

const defaults: PlatformSettings = {
  name: "BankVault",
  tagline: "Modern Digital Banking",
  logoUrl: "/uploads/logo.png",
  email: "support@bankvault.com",
  phone: "+1 (800) 555-0199",
  address: "350 Fifth Avenue, Suite 3200, New York, NY 10118",
  mailFrom: "noreply@bankvault.com",
  mailName: "BankVault Notifications",
};

/**
 * Fetch all platform settings from DB in one query.
 * Falls back to defaults for any missing key.
 * Cache-friendly: called once per layout render.
 */
export async function getPlatformSettings(): Promise<PlatformSettings> {
  const rows = await prisma.systemSetting.findMany({
    where: { key: { startsWith: "platform_" } },
    select: { key: true, value: true },
  });

  const map: Record<string, string> = {};
  for (const row of rows) {
    if (row.value) map[row.key] = row.value;
  }

  return {
    name: map.platform_name || defaults.name,
    tagline: map.platform_tagline || defaults.tagline,
    logoUrl: map.platform_logo_url || defaults.logoUrl,
    email: map.platform_email || defaults.email,
    phone: map.platform_phone || defaults.phone,
    address: map.platform_address || defaults.address,
    mailFrom: map.platform_mail_from || defaults.mailFrom,
    mailName: map.platform_mail_name || defaults.mailName,
  };
}
