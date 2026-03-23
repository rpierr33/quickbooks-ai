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
  ChevronLeft,
  ChevronRight,
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
  const [expanded, setExpanded] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 hidden md:flex h-screen flex-col border-r border-gray-100 bg-white transition-all duration-300 ease-in-out",
        expanded ? "w-56" : "w-16"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-gray-50 px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <span className="text-sm font-bold text-white">Q</span>
          </div>
          {expanded && (
            <span className="text-sm font-semibold text-gray-900 animate-fade-in">
              QuickBooks AI
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-indigo-600" : "text-gray-400")} />
              {expanded && <span className="animate-fade-in">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* AI Assistant Button */}
      <div className="px-2 pb-2">
        <Link
          href="/ai"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
            pathname === "/ai"
              ? "bg-indigo-600 text-white"
              : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
          )}
        >
          <Sparkles className="h-5 w-5 shrink-0" />
          {expanded && <span className="animate-fade-in">AI Assistant</span>}
        </Link>
      </div>

      {/* Toggle */}
      <div className="border-t border-gray-50 p-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
        >
          {expanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}

// Mobile bottom navigation
export function MobileNav() {
  const pathname = usePathname();

  const mobileItems = [
    { href: "/", icon: LayoutDashboard, label: "Home" },
    { href: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
    { href: "/invoices", icon: FileText, label: "Invoices" },
    { href: "/reports", icon: BarChart3, label: "Reports" },
    { href: "/ai", icon: Sparkles, label: "AI" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-md safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {mobileItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg min-w-0 transition-colors",
                isActive ? "text-indigo-600" : "text-gray-400"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "text-indigo-600")} />
              <span className="text-[10px] font-medium truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
