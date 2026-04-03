"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Sidebar, MobileNav } from "./sidebar";
import { Header } from "./header";

// Pages that should NOT show the authenticated layout (sidebar/header)
const PUBLIC_PATHS = ["/login", "/pay", "/billing", "/onboarding"];

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { status } = useSession();

  const isPublicPage = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Public pages or unauthenticated users: render without chrome
  if (isPublicPage || status !== "authenticated") {
    return <>{children}</>;
  }

  // Authenticated users on protected pages: render with full layout
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFC" }}>
      <Sidebar />
      <div
        className="main-content-wrapper"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflowX: "hidden",
        }}
      >
        <Header />
        <main
          className="main-content-area"
          style={{ flex: 1, padding: "28px 32px 96px" }}
        >
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
