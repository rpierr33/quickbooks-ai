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
          <div className="flex min-h-screen bg-[#eef0f4]">
            <Sidebar />
            <div className="flex-1 min-w-0 md:ml-52 overflow-hidden">
              <Header />
              <main className="p-4 md:p-5 pb-20 md:pb-5 max-w-full overflow-hidden">
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
