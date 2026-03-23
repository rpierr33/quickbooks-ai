import type { Metadata } from "next";
import "./globals.css";
import { Sidebar, MobileNav } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "QuickBooks AI — Smart Accounting",
  description: "AI-powered accounting platform for modern businesses",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="flex min-h-screen">
            {/* Desktop sidebar */}
            <Sidebar />
            {/* Main content: ml-16 on desktop, no margin on mobile */}
            <div className="flex-1 md:ml-16">
              <Header />
              <main className="px-4 py-4 md:p-6 pb-24 md:pb-6">
                {children}
              </main>
            </div>
            {/* Mobile bottom nav */}
            <MobileNav />
          </div>
        </Providers>
      </body>
    </html>
  );
}
