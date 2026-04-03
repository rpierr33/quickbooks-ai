import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — Ledgr",
  description: "Sign in to your Ledgr accounting dashboard",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  // Login page — no sidebar, no header, no dashboard chrome
  return (
    <div style={{ display: "contents" }}>
      {children}
    </div>
  );
}
