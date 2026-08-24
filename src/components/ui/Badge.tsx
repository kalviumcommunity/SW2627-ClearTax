interface BadgeProps {
  status: "matched" | "mismatched" | "processing" | "error";
}

const statusStyles = {
  matched: {
    label: "Matched",
    icon: "✓",
    className:
      "bg-success-surface text-success-foreground",
  },

  mismatched: {
    label: "Mismatched",
    icon: "⚠",
    className:
      "bg-warning-surface text-warning-foreground",
  },

  processing: {
    label: "Processing",
    icon: "↻",
    className:
      "bg-info-surface text-info-foreground",
  },

  error: {
    label: "Error",
    icon: "!",
    className:
      "bg-error-surface text-error-foreground",
  },
};

export default function Badge({ status }: BadgeProps) {
  const config = statusStyles[status];

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        rounded-md
        px-3
        py-1.5
        text-sm
        font-medium
        ${config.className}
      `}
    >
      <span aria-hidden="true">{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}