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
    <header className="sticky top-0 z-30 flex h-14 md:h-16 items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-md px-4 md:px-6">
      {/* Mobile: logo + title */}
      <div className="flex items-center gap-3">
        <div className="flex md:hidden h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
          <span className="text-xs font-bold text-white">Q</span>
        </div>
        <h1 className="text-base md:text-lg font-semibold text-gray-900">{title}</h1>
      </div>
    </header>
  );
}
