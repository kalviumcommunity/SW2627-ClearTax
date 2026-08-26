import {
  cloneElement,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger";

type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
  children?: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover",
  secondary:
    "border border-border bg-surface text-foreground hover:bg-surface-muted",
  ghost:
    "bg-transparent text-foreground hover:bg-surface-muted",
  danger:
    "bg-error text-white hover:bg-red-700",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
  lg: "h-10 px-5 text-sm",
};

export default function Button({
  variant = "primary",
  size = "md",
  asChild = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const styles = `
    inline-flex
    items-center
    justify-center
    gap-2
    rounded-md
    font-medium
    transition-colors
    disabled:pointer-events-none
    disabled:opacity-50
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${className}
  `;

  if (
    asChild &&
    isValidElement<{ className?: string }>(children)
  ) {
    return cloneElement(children, {
      className: styles,
    });
  }

  return (
    <button className={styles} {...props}>
      {children}
    </button>
  );
}
