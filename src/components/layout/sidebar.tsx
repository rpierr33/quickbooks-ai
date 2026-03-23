"use client";
import React from "react";
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

  return (
    <aside className="fixed left-0 top-0 z-40 hidden md:flex w-52 h-screen flex-col bg-[#1c2b3a]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 h-14 px-4 border-b border-white/10">
        <div className="h-7 w-7 rounded bg-emerald-500 flex items-center justify-center shrink-0">
          <span className="text-[11px] font-extrabold text-white">Q</span>
        </div>
        <span className="text-[13px] font-bold text-white">QuickBooks AI</span>
      </div>

      <nav className="flex-1 py-2 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded px-3 py-2 text-[13px] font-medium transition-colors cursor-pointer",
                isActive
                  ? "bg-white/15 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="h-[17px] w-[17px] shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-2 pb-3">
        <Link
          href="/ai"
          className={cn(
            "flex items-center gap-2.5 rounded px-3 py-2 text-[13px] font-medium transition-colors cursor-pointer",
            pathname === "/ai"
              ? "bg-emerald-500 text-white"
              : "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
          )}
        >
          <Sparkles className="h-[17px] w-[17px] shrink-0" />
          <span>AI Assistant</span>
        </Link>
      </div>
    </aside>
  );
}

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
            <Link key={item.href} href={item.href}
              className={cn("flex flex-col items-center gap-0.5 px-3 py-1 cursor-pointer", isActive ? "text-emerald-600" : "text-gray-400")}
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
