"use client";

import { useState } from "react";
import WorkspaceNavLinks from "@/components/layout/WorkspaceNavLinks";

type MobileNavProps = {
  userInitial: string;
};

export default function MobileNav({ userInitial }: MobileNavProps) {
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
          {userInitial}
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

          <WorkspaceNavLinks onNavigate={() => setOpen(false)} />
        </nav>
      </aside>
    </>
  );
}
