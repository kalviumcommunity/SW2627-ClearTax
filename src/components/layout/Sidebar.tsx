import WorkspaceNavLinks from "@/components/layout/WorkspaceNavLinks";

export default function Sidebar() {
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

        <WorkspaceNavLinks
          iconClassName="text-base"
          linkClassName="transition-colors"
        />
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
