"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: "▦",
  },
  {
    name: "Upload History",
    href: "/history",
    icon: "◷",
  },
  {
    name: "Reconciliation",
    href: "/reconciliation",
    icon: "⇄",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="
        fixed
        inset-y-0
        left-0
        z-40
        hidden
        w-[var(--ds-sidebar-width)]
        border-r
        border-border
        bg-surface
        lg:flex
        lg:flex-col
      "
    >
      {/* Logo */}
      <div
        className="
          flex
          h-[var(--ds-header-height)]
          items-center
          border-b
          border-border
          px-6
        "
      >
        <div>
          <p className="text-lg font-bold text-foreground">
            ClearTax
          </p>

          <p className="text-xs text-slate-500">
            Bulk Reconciliation
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Workspace
        </p>

        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" &&
                pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex
                  items-center
                  gap-3
                  rounded-md
                  px-3
                  py-2.5
                  text-sm
                  font-medium
                  transition-colors
                  ${
                    isActive
                      ? "bg-info-surface text-info-foreground"
                      : "text-slate-600 hover:bg-surface-muted hover:text-foreground"
                  }
                `}
              >
                <span
                  className="text-base"
                  aria-hidden="true"
                >
                  {item.icon}
                </span>

                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <div className="rounded-md bg-surface-muted p-3">
          <p className="text-xs font-medium text-foreground">
            Reconciliation
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Bulk invoice workspace
          </p>
        </div>
      </div>
    </aside>
  );
}