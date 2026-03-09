import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Get the admin session and verify the user still exists in the database.
 * Returns null if not authenticated, not admin, or user no longer in DB.
 * This prevents foreign key errors when JWT holds a stale user ID (e.g., after DB reset).
 */
export async function getAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return null;

  // Verify user still exists in DB
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user || user.role !== "ADMIN") return null;

  return { ...session, user: { ...session.user, id: user.id, name: user.name } };
}
