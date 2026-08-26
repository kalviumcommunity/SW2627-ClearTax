"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: "▦",
  },
  {
    name: "Reconciliations",
    href: "/reconciliations",
    icon: "◷",
  },
  {
    name: "Reference Imports",
    href: "/reference-imports",
    icon: "⇄",
  },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <div
        className="
          flex
          h-[var(--ds-header-height)]
          items-center
          justify-between
          border-b
          border-border
          bg-surface
          px-4
          lg:hidden
        "
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-md
            text-lg
            text-foreground
            hover:bg-surface-muted
          "
          aria-label="Open navigation"
        >
          ☰
        </button>

        <div className="text-center">
          <p className="text-sm font-bold text-foreground">
            ClearTax
          </p>

          <p className="text-[10px] text-slate-500">
            Bulk Reconciliation
          </p>
        </div>

        <div
          className="
            flex
            h-8
            w-8
            items-center
            justify-center
            rounded-full
            bg-primary
            text-xs
            font-semibold
            text-primary-foreground
          "
        >
          E
        </div>
      </div>

      {/* Overlay */}
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
          className="
            fixed
            inset-0
            z-40
            bg-black/30
            lg:hidden
          "
        />
      )}

      {/* Drawer */}
      <aside
        className={`
          fixed
          inset-y-0
          left-0
          z-50
          w-[280px]
          border-r
          border-border
          bg-surface
          shadow-dropdown
          transition-transform
          duration-200
          lg:hidden
          ${
            open
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        <div
          className="
            flex
            h-[var(--ds-header-height)]
            items-center
            justify-between
            border-b
            border-border
            px-5
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

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-md
              text-lg
              text-slate-500
              hover:bg-surface-muted
              hover:text-foreground
            "
            aria-label="Close navigation"
          >
            ×
          </button>
        </div>

        <nav className="p-4">
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
                  onClick={() => setOpen(false)}
                  className={`
                    flex
                    items-center
                    gap-3
                    rounded-md
                    px-3
                    py-2.5
                    text-sm
                    font-medium
                    ${
                      isActive
                        ? "bg-info-surface text-info-foreground"
                        : "text-slate-600 hover:bg-surface-muted hover:text-foreground"
                    }
                  `}
                >
                  <span aria-hidden="true">
                    {item.icon}
                  </span>

                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
}
