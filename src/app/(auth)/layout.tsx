import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Sign in | ClearTax Bulk Invoice Reconciliation",
  description: "Sign in to the ClearTax bulk invoice reconciliation workspace",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
