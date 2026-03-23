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
import { motion } from "framer-motion";

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
        "fixed left-0 top-0 z-40 hidden md:flex h-screen flex-col bg-white/60 backdrop-blur-2xl border-r border-white/70 transition-all duration-300 ease-in-out",
        expanded ? "w-56" : "w-[68px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-center px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20">
            <span className="text-sm font-extrabold text-white">Q</span>
          </div>
          {expanded && (
            <span className="text-sm font-bold text-slate-800 animate-fade-in">
              QuickBooks AI
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2.5 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-200 cursor-pointer",
                isActive
                  ? "bg-indigo-50/80 text-indigo-600 shadow-sm shadow-indigo-500/5"
                  : "text-slate-500 hover:bg-slate-50/80 hover:text-slate-700"
              )}
            >
              <item.icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-indigo-600" : "text-slate-400")} />
              {expanded && <span className="animate-fade-in">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* AI Assistant */}
      <div className="px-2.5 pb-2">
        <Link
          href="/ai"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-200 cursor-pointer",
            pathname === "/ai"
              ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25"
              : "bg-indigo-50/60 text-indigo-600 hover:bg-indigo-50"
          )}
        >
          <Sparkles className="h-[18px] w-[18px] shrink-0" />
          {expanded && <span className="animate-fade-in">AI Assistant</span>}
        </Link>
      </div>

      {/* Toggle */}
      <div className="border-t border-slate-100/60 p-2.5">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-center rounded-xl p-2 text-slate-400 hover:bg-slate-50/80 hover:text-slate-600 transition-colors cursor-pointer"
        >
          {expanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}

// Floating pill mobile nav
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
    <motion.nav
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 28, delay: 0.1 }}
      className="fixed bottom-4 left-3 right-3 z-50 md:hidden"
    >
      <div className="flex items-center justify-around rounded-2xl bg-white/80 backdrop-blur-2xl border border-white/70 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)] px-1 py-1.5 safe-area-bottom">
        {mobileItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center px-3 py-1.5 rounded-xl cursor-pointer"
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-active"
                  className="absolute inset-0 bg-indigo-50/80 rounded-xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <item.icon
                className={cn(
                  "h-5 w-5 relative z-10 transition-colors duration-200",
                  isActive ? "text-indigo-600" : "text-slate-400"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-semibold mt-0.5 relative z-10 transition-colors duration-200",
                  isActive ? "text-indigo-600" : "text-slate-400"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
