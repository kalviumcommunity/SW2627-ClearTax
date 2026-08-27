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

interface WorkspaceNavLinksProps {
  iconClassName?: string;
  linkClassName?: string;
  onNavigate?: () => void;
}

export default function WorkspaceNavLinks({
  iconClassName = "",
  linkClassName = "",
  onNavigate,
}: WorkspaceNavLinksProps) {
  const pathname = usePathname();

  return (
    <div className="space-y-1">
      {navigation.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`
              flex
              items-center
              gap-3
              rounded-md
              px-3
              py-2.5
              text-sm
              font-medium
              ${linkClassName}
              ${
                isActive
                  ? "bg-info-surface text-info-foreground"
                  : "text-slate-600 hover:bg-surface-muted hover:text-foreground"
              }
            `}
          >
            <span className={iconClassName} aria-hidden="true">
              {item.icon}
            </span>

            <span>{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
