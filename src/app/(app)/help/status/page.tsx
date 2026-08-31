import Link from "next/link";

import PageContainer from "@/components/layout/PageContainer";

import Card from "@/components/ui/Card";
// This page contains only public, non-sensitive help content.
// Reconciliation, tax, invoice, and batch data are intentionally
// excluded so those data-heavy routes remain dynamically rendered.
export const revalidate = 3600;

const statuses = [
  {
    status: "QUEUED",
    description:
      "Batch has been accepted but processing has not begun.",
  },
  {
    status: "PROCESSING",
    description:
      "At least one row is being/has been processed and more remain.",
  },
  {
    status: "COMPLETED",
    description:
      "All rows processed and errorRows = 0.",
  },
  {
    status: "COMPLETED_WITH_ERRORS",
    description:
      "All processable rows were attempted, but one or more rows have ERROR.",
  },
  {
    status: "FAILED",
    description:
      "The overall batch could not be processed.",
  },
];

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join(" ");
}

export default function StatusReferencePage() {
  return (
    <PageContainer>
      <div>
        <p className="text-sm font-medium text-slate-500">
          Help & Status Reference
        </p>

        <h1 className="mt-1 text-2xl font-semibold text-foreground">
          Upload Batch Statuses
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Reference information for reconciliation batch
          processing statuses.
        </p>
      </div>

      <div className="mt-6 grid gap-4">
        {statuses.map((item) => (
          <Link
            key={item.status}
            href={`/help/status/${item.status}`}
            className="block"
          >
            <Card className="p-5 transition-colors hover:bg-surface-muted">
              <p className="font-semibold text-foreground">
                {formatStatus(item.status)}
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {item.description}
              </p>

              <p className="mt-3 text-sm font-medium text-primary">
                View details →
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}