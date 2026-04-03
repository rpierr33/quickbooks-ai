import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pay Invoice — Ledgr",
  description: "Secure invoice payment powered by Ledgr",
};

export default function PayLayout({ children }: { children: React.ReactNode }) {
  // Public-facing layout — no sidebar, no header, no dashboard chrome
  return (
    <div style={{ display: "contents" }}>
      {children}
    </div>
  );
}
