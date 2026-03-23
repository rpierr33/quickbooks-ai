"use client";
import React from "react";
import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/transactions": "Transactions",
  "/invoices": "Invoices",
  "/reports": "Reports",
  "/settings": "Settings",
  "/ai": "AI Assistant",
};

export function Header() {
  const pathname = usePathname();
  const title = pageTitles[pathname] || "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-14 md:h-16 items-center justify-between bg-white/50 backdrop-blur-xl border-b border-white/60 px-4 md:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile logo */}
        <div className="flex md:hidden h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-md shadow-indigo-500/20">
          <span className="text-xs font-extrabold text-white">Q</span>
        </div>
        <h1 className="text-base md:text-lg font-bold text-slate-800">{title}</h1>
      </div>
    </header>
  );
}
