"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Sidebar, MobileNav } from "./sidebar";
import { Header } from "./header";
import { HelpPanel } from "@/components/ui/help-panel";

// Pages that should NOT show the authenticated layout (sidebar/header)
const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password", "/pay", "/portal", "/billing", "/onboarding"];

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { status } = useSession();

  const isPublicPage = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (isPublicPage || status !== "authenticated") {
    return <>{children}</>;
  }

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Header />
        <main className="content">{children}</main>
      </div>
      <MobileNav />
      <HelpPanel />
    </div>
  );
}
