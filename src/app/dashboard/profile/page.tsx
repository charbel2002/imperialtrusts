import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDictionary } from "@/lib/dictionary";
import { getPlatformSettings } from "@/lib/platform";
import { Card, CardBody } from "@/components/ui/index";
import { Package } from "lucide-react";
import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const userLang = (session.user.language || "en") as Locale;
  const platform = await getPlatformSettings();
  const dict = await getDictionary(userLang, platform);
  const tp = dict.txnProgress || {};

  return (
    <Card>
      <CardBody className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
          <Package size={32} className="text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 font-heading">{tp.profileTitle || "Profile"}</h3>
        <p className="mt-2 text-sm text-slate-500">{tp.profilePlaceholder || "This module will be built in a future iteration."}</p>
      </CardBody>
    </Card>
  );
}
