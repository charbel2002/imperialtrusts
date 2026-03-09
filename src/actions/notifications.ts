"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- Mark Single Notification as Read -----------------------

export async function markNotificationRead(notificationId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  await prisma.notification.updateMany({
    where: { id: notificationId, userId: session.user.id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

  revalidatePath("/dashboard/notifications");
  return { success: true };
}

// --- Mark All Notifications as Read -------------------------

export async function markAllNotificationsRead() {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

  revalidatePath("/dashboard/notifications");
  return { success: true };
}

// --- Delete Notification ------------------------------------

export async function deleteNotification(notificationId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  await prisma.notification.deleteMany({
    where: { id: notificationId, userId: session.user.id },
  });

  revalidatePath("/dashboard/notifications");
  return { success: true };
}

// --- Delete All Read Notifications --------------------------

export async function deleteAllReadNotifications() {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  await prisma.notification.deleteMany({
    where: { userId: session.user.id, isRead: true },
  });

  revalidatePath("/dashboard/notifications");
  return { success: true };
}

// --- Get Unread Count ---------------------------------------

export async function getUnreadNotificationCount() {
  const session = await getServerSession(authOptions);
  if (!session) return 0;

  return prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  });
}
