"use server";

import { getAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- Update a Single Setting --------------------------------

export async function updateSetting(key: string, value: string) {
  const session = await getAdminSession();
  if (!session) return { error: "Unauthorized or session expired. Please sign in again." };

  const existing = await prisma.systemSetting.findUnique({ where: { key } });
  if (!existing) return { error: `Setting "${key}" not found` };

  await prisma.systemSetting.update({
    where: { key },
    data: { value },
  });

  await prisma.adminLog.create({
    data: {
      adminId: session.user.id,
      action: "SETTING_UPDATED",
      targetType: "SystemSetting",
      targetId: existing.id,
      description: `Updated "${key}" from "${existing.value}" to "${value}"`,
      metadata: { key, oldValue: existing.value, newValue: value },
    },
  });

  revalidatePath("/admin/settings");
  return { success: true };
}

// --- Bulk Update Multiple Settings --------------------------

export async function bulkUpdateSettings(settings: Record<string, string>) {
  const session = await getAdminSession();

  const keys = Object.keys(settings);
  if (keys.length === 0) return { error: "No settings provided" };

  const operations = keys.map((key) =>
    prisma.systemSetting.upsert({
      where: { key },
      update: { value: settings[key] },
      create: { key, value: settings[key], type: inferType(settings[key]) },
    })
  );

  await prisma.$transaction(operations);

  await prisma.adminLog.create({
    data: {
      adminId: session.user.id,
      action: "SETTINGS_BULK_UPDATE",
      targetType: "SystemSetting",
      description: `Updated ${keys.length} settings: ${keys.join(", ")}`,
      metadata: settings,
    },
  });

  revalidatePath("/admin/settings");
  return { success: true };
}

// --- Create a New Custom Setting ----------------------------

export async function createSetting(key: string, value: string, type: string) {
  const session = await getAdminSession();

  if (!key.trim() || !key.match(/^[a-z_]+$/)) {
    return { error: "Key must be lowercase letters and underscores only" };
  }

  const existing = await prisma.systemSetting.findUnique({ where: { key } });
  if (existing) return { error: `Setting "${key}" already exists` };

  await prisma.systemSetting.create({
    data: { key: key.trim(), value, type },
  });

  await prisma.adminLog.create({
    data: {
      adminId: session.user.id,
      action: "SETTING_CREATED",
      targetType: "SystemSetting",
      description: `Created new setting "${key}" = "${value}" (${type})`,
    },
  });

  revalidatePath("/admin/settings");
  return { success: true };
}

// --- Delete a Custom Setting --------------------------------

export async function deleteSetting(key: string) {
  const session = await getAdminSession();

  const protectedKeys = ["kyc_required", "platform_name", "platform_tagline", "platform_email", "platform_phone", "platform_address", "platform_mail_from", "platform_mail_name", "platform_logo_url", "default_currency"];
  if (protectedKeys.includes(key)) {
    return { error: "Cannot delete core system settings" };
  }

  const existing = await prisma.systemSetting.findUnique({ where: { key } });
  if (!existing) return { error: "Setting not found" };

  await prisma.systemSetting.delete({ where: { key } });

  await prisma.adminLog.create({
    data: {
      adminId: session.user.id,
      action: "SETTING_DELETED",
      targetType: "SystemSetting",
      description: `Deleted setting "${key}"`,
    },
  });

  revalidatePath("/admin/settings");
  return { success: true };
}

// --- Reset All Settings to Defaults -------------------------

export async function resetSettingsToDefaults() {
  const session = await getAdminSession();

  const defaults: Record<string, { value: string; type: string }> = {
    kyc_required: { value: "true", type: "boolean" },
    platform_name: { value: "BankVault", type: "string" },
    platform_tagline: { value: "Modern Digital Banking", type: "string" },
    platform_logo_url: { value: "/uploads/logo.png", type: "string" },
    platform_email: { value: "support@bankvault.com", type: "string" },
    platform_phone: { value: "+1 (800) 555-0199", type: "string" },
    platform_address: { value: "350 Fifth Avenue, Suite 3200, New York, NY 10118", type: "string" },
    platform_mail_from: { value: "noreply@bankvault.com", type: "string" },
    platform_mail_name: { value: "BankVault Notifications", type: "string" },
    default_currency: { value: "USD", type: "string" },
    transfer_fee_percentage: { value: "0.5", type: "float" },
    min_transfer_amount: { value: "1", type: "float" },
    max_transfer_amount: { value: "50000", type: "float" },
  };

  const operations = Object.entries(defaults).map(([key, { value, type }]) =>
    prisma.systemSetting.upsert({
      where: { key },
      update: { value, type },
      create: { key, value, type },
    })
  );

  await prisma.$transaction(operations);

  await prisma.adminLog.create({
    data: {
      adminId: session.user.id,
      action: "SETTINGS_RESET",
      targetType: "SystemSetting",
      description: "Reset all settings to factory defaults",
    },
  });

  revalidatePath("/admin/settings");
  return { success: true };
}

// Helper
function inferType(value: string): string {
  if (value === "true" || value === "false") return "boolean";
  if (!isNaN(Number(value)) && value.includes(".")) return "float";
  if (!isNaN(Number(value))) return "integer";
  return "string";
}
