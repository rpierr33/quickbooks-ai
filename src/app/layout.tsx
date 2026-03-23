import type { Metadata } from "next";
import "./globals.css";
import { Sidebar, MobileNav } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "QuickBooks AI — Smart Accounting",
  description: "AI-powered accounting platform for modern businesses",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body>
        <Providers>
          <div className="flex min-h-screen bg-[#f2f4f7]">
            <Sidebar />
            <div className="flex-1 md:ml-52">
              <Header />
              <main className="p-4 md:p-6 pb-20 md:pb-6">
                {children}
              </main>
            </div>
            <MobileNav />
          </div>
        </Providers>
      </body>
    </html>
  );
}
