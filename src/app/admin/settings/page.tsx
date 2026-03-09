import { prisma } from "@/lib/prisma";
import { SettingsManager } from "@/components/admin/settings-manager";
import { Card, CardBody } from "@/components/ui/index";
import { Settings } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Paramètres" };

export default async function AdminSettingsPage() {
  const settings = await prisma.systemSetting.findMany({
    orderBy: { key: "asc" },
  });

  const settingsMap = settings.map((s) => ({
    id: s.id,
    key: s.key,
    value: s.value ?? "",
    type: s.type,
    updatedAt: s.updatedAt.toISOString(),
  }));

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <Settings size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 font-heading">System Settings</h1>
          <p className="text-sm text-slate-500">Configure platform behavior and limits</p>
        </div>
      </div>

      <SettingsManager settings={settingsMap} />
    </div>
  );
}
