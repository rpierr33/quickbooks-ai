"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ArrowLeftRight,
  FileText,
  BarChart3,
  Settings,
  Sparkles,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { href: "/invoices", icon: FileText, label: "Invoices" },
  { href: "/reports", icon: BarChart3, label: "Reports" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(true);

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 hidden md:flex h-screen flex-col bg-[#1a2332] transition-all duration-200",
      expanded ? "w-52" : "w-16"
    )}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 h-14 px-4 border-b border-white/10">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-emerald-500 shrink-0">
          <span className="text-[11px] font-extrabold text-white">Q</span>
        </div>
        {expanded && <span className="text-[13px] font-bold text-white truncate">QuickBooks AI</span>}
      </div>

      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors cursor-pointer",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {expanded && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* AI Button */}
      <div className="px-2 pb-2">
        <Link
          href="/ai"
          className={cn(
            "flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors cursor-pointer",
            pathname === "/ai"
              ? "bg-emerald-500 text-white"
              : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
          )}
        >
          <Sparkles className="h-[18px] w-[18px] shrink-0" />
          {expanded && <span>AI Assistant</span>}
        </Link>
      </div>

      <div className="border-t border-white/10 p-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-center rounded-md p-1.5 text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors cursor-pointer"
        >
          {expanded ? <ChevronsLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}

// Mobile bottom nav — simple, solid
const mobileItems = [
  { href: "/", icon: LayoutDashboard, label: "Home" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Activity" },
  { href: "/invoices", icon: FileText, label: "Invoices" },
  { href: "/reports", icon: BarChart3, label: "Reports" },
  { href: "/ai", icon: Sparkles, label: "AI" },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {mobileItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 cursor-pointer",
                isActive ? "text-emerald-600" : "text-gray-400"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
