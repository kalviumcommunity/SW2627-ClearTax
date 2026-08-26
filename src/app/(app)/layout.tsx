import type { Metadata } from "next";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import "../globals.css";

export const metadata: Metadata = {
  title: "ClearTax Bulk Invoice Reconciliation",
  description: "ClearTax bulk invoice reconciliation workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
  <div className="min-h-screen bg-background">
    <Sidebar />

    <MobileNav />

    <div className="lg:pl-[var(--ds-sidebar-width)]">
      <div className="hidden lg:block">
        <Header />
      </div>

      {children}
    </div>
  </div>
</body>
    </html>
  );
}