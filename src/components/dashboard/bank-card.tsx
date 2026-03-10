"use client";

import { cn } from "@/lib/utils";
import { Snowflake, Wifi } from "lucide-react";

interface Props {
  cardType: "VISA" | "MASTERCARD";
  cardNumber: string;
  holderName: string;
  expirationDate: string;
  balance: number;
  currency?: string;
  status: string;
  showFull?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  labels?: {
    frozen?: string;
    cancelled?: string;
    balance?: string;
    cardHolder?: string;
    expires?: string;
  };
}

export function BankCard({
  cardType,
  cardNumber,
  holderName,
  expirationDate,
  balance,
  currency = "USD",
  status,
  showFull = false,
  size = "md",
  className,
  labels,
}: Props) {
  const masked = showFull
    ? cardNumber.replace(/(.{4})/g, "$1 ").trim()
    : `**** **** **** ${cardNumber.slice(-4)}`;

  const isVisa = cardType === "VISA";
  const isFrozen = status === "FROZEN";
  const isCancelled = status === "CANCELLED";
  const isExpired = status === "EXPIRED";
  const isInactive = isFrozen || isCancelled || isExpired;

  const gradients = isVisa
    ? "from-[#0A2540] via-[#122d52] to-[#1E40AF]"
    : "from-[#1a1a2e] via-[#16213e] to-[#0f3460]";

  const sizes = {
    sm: "p-4 rounded-xl",
    md: "p-6 rounded-2xl",
    lg: "p-8 rounded-2xl",
  };

  const textSizes = {
    sm: { number: "text-xs", holder: "text-[10px]", label: "text-[8px]", balance: "text-sm" },
    md: { number: "text-sm", holder: "text-xs", label: "text-[10px]", balance: "text-lg" },
    lg: { number: "text-base", holder: "text-sm", label: "text-xs", balance: "text-xl" },
  };

  const ts = textSizes[size];

  return (
    <div
      className={cn(
        "relative bg-gradient-to-br text-white shadow-xl overflow-hidden select-none",
        gradients,
        sizes[size],
        isInactive && "opacity-70 grayscale-[30%]",
        className
      )}
    >
      {/* Shine overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-white/[0.03] pointer-events-none" />

      {/* Decorative circles */}
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/[0.04]" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/[0.03]" />

      {/* Frozen overlay */}
      {isFrozen && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-400/20 backdrop-blur-sm border border-blue-300/20">
          <Snowflake size={10} className="text-blue-300" />
          <span className="text-[9px] font-medium text-blue-300">{labels?.frozen || "FROZEN"}</span>
        </div>
      )}

      {isCancelled && (
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-red-400/20 backdrop-blur-sm border border-red-300/20">
          <span className="text-[9px] font-medium text-red-300">{labels?.cancelled || "CANCELLED"}</span>
        </div>
      )}

      <div className="relative">
        {/* Top row: chip + contactless + brand */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {/* Chip */}
            <div className={cn("rounded bg-gradient-to-br from-yellow-300 to-yellow-500 opacity-90", size === "sm" ? "w-8 h-6" : "w-10 h-7")} />
            {/* Contactless */}
            <Wifi size={size === "sm" ? 14 : 18} className="text-white/40 rotate-90" />
          </div>
          {/* Brand */}
          {isVisa ? (
            <span className={cn("font-bold tracking-wider text-white/80", size === "sm" ? "text-sm" : "text-lg")}>VISA</span>
          ) : (
            <div className="flex -space-x-2">
              <div className={cn("rounded-full bg-red-500/70", size === "sm" ? "w-5 h-5" : "w-7 h-7")} />
              <div className={cn("rounded-full bg-yellow-500/60", size === "sm" ? "w-5 h-5" : "w-7 h-7")} />
            </div>
          )}
        </div>

        {/* Card number */}
        <p className={cn("text-white/70 tracking-[0.2em] font-mono", ts.number)}>{masked}</p>

        {/* Balance */}
        <div className="mt-3">
          <p className={cn("text-white/40 uppercase tracking-wider", ts.label)}>{labels?.balance || "Balance"}</p>
          <p className={cn("font-bold text-white font-heading", ts.balance)}>
            ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Bottom: holder + expiry */}
        <div className={cn("flex items-end justify-between", size === "sm" ? "mt-3" : "mt-5")}>
          <div>
            <p className={cn("text-white/40 uppercase tracking-wider", ts.label)}>{labels?.cardHolder || "Card Holder"}</p>
            <p className={cn("text-white font-medium mt-0.5 uppercase", ts.holder)}>{holderName}</p>
          </div>
          <div className="text-right">
            <p className={cn("text-white/40 uppercase tracking-wider", ts.label)}>{labels?.expires || "Expires"}</p>
            <p className={cn("text-white font-medium mt-0.5", ts.holder)}>{expirationDate}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
