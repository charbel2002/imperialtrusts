import { Suspense } from "react";
import { DM_Sans, Instrument_Sans } from "next/font/google";
import { SessionProvider } from "@/components/shared/session-provider";
import { RouteProgressBar } from "@/components/shared/route-progress-bar";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${dmSans.variable} ${instrumentSans.variable}`} suppressHydrationWarning>
      <body className="min-h-screen font-sans">
        <Suspense fallback={null}>
          <RouteProgressBar />
        </Suspense>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
