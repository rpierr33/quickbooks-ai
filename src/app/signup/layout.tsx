import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up — Ledgr",
  description: "Create your Ledgr accounting account",
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  // Signup page — no sidebar, no header, no dashboard chrome (matches /login)
  return <div style={{ display: "contents" }}>{children}</div>;
}
