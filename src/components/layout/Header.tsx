interface HeaderProps {
  title?: string;
}

export default function Header({
  title = "Dashboard",
}: HeaderProps) {
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
          E
        </div>
      </div>
    </header>
  );
}