interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageContainer({
  children,
  className = "",
}: PageContainerProps) {
  return (
    <main
      className={`
        min-h-[calc(100vh-var(--ds-header-height))]
        w-full
        px-4
        py-6
        sm:px-6
        lg:px-8
        ${className}
      `}
    >
      <div className="mx-auto w-full max-w-[var(--ds-content-max-width)]">
        {children}
      </div>
    </main>
  );
}