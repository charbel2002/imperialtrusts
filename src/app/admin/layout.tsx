import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPlatformSettings } from "@/lib/platform";
import { AdminShell } from "@/components/admin/shell";

export async function generateMetadata(): Promise<Metadata> {
  const p = await getPlatformSettings();
  return { title: { default: `Administration | ${p.name}`, template: `%s | ${p.name} Admin` } };
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/en/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const platform = await getPlatformSettings();

  return <AdminShell user={session.user} platformName={platform.name}>{children}</AdminShell>;
}
