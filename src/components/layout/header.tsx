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
    <header className="sticky top-0 z-30 flex h-14 items-center bg-white border-b border-gray-200 px-4 md:px-6">
      <div className="flex items-center gap-3">
        <div className="flex md:hidden h-7 w-7 items-center justify-center rounded bg-emerald-500">
          <span className="text-[11px] font-extrabold text-white">Q</span>
        </div>
        <h1 className="text-sm font-bold text-gray-800">{title}</h1>
      </div>
    </header>
  );
}
