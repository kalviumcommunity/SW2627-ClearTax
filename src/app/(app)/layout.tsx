import type { Metadata } from "next";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import { requireCurrentUser } from "@/lib/auth";
import "../globals.css";

export const metadata: Metadata = {
  title: "ClearTax Bulk Invoice Reconciliation",
  description: "ClearTax bulk invoice reconciliation workspace",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireCurrentUser();

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-background">
          <Sidebar />

          <MobileNav userInitial={getUserInitial(user.name, user.email)} />

          <div className="lg:pl-[var(--ds-sidebar-width)]">
            <div className="hidden lg:block">
              <Header user={user} />
            </div>

            {children}
          </div>
        </div>
      </body>
    </html>
  );
}

function getUserInitial(name: string | null, email: string) {
  return (name ?? email).trim().charAt(0).toUpperCase();
}
