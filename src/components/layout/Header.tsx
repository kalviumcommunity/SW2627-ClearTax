import type { AuthenticatedUser } from "@/lib/auth";
import SignOutButton from "@/components/auth/SignOutButton";

interface HeaderProps {
  title?: string;
  user: AuthenticatedUser;
}

export default function Header({
  title = "Dashboard",
  user,
}: HeaderProps) {
  const userInitial = (user.name ?? user.email).trim().charAt(0).toUpperCase();

  return (
    <header
      className="
        sticky
        top-0
        z-30
        flex
        h-[var(--ds-header-height)]
        items-center
        justify-between
        border-b
        border-border
        bg-surface
        px-6
      "
    >
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-foreground">
            {user.name ?? user.email}
          </p>
          <p className="text-xs text-slate-500">{user.email}</p>
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
            text-sm
            font-semibold
            text-primary-foreground
          "
          aria-label="User profile"
        >
          {userInitial}
        </div>

        <SignOutButton />
      </div>
    </header>
  );
}
