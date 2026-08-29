import Link from "next/link";

import { notFound } from "next/navigation";

import PageContainer from "@/components/layout/PageContainer";

import Card from "@/components/ui/Card";

const statusDetails = {
  QUEUED: {
    title: "Queued",
    description:
      "Batch has been accepted but processing has not begun.",
  },

  PROCESSING: {
    title: "Processing",
    description:
      "At least one row is being/has been processed and more remain.",
  },

  COMPLETED: {
    title: "Completed",
    description:
      "All rows processed and errorRows = 0.",
    note: "Mismatches do not make the batch technically failed.",
  },

  COMPLETED_WITH_ERRORS: {
    title: "Completed With Errors",
    description:
      "All processable rows were attempted, but one or more rows have ERROR.",
  },

  FAILED: {
    title: "Failed",
    description:
      "The overall batch could not be processed.",
    examples: [
      "Unreadable CSV",
      "Missing required headers",
      "Raw upload unavailable",
      "Unrecoverable internal job failure",
    ],
  },
} as const;

type Status = keyof typeof statusDetails;

export function generateStaticParams() {
  return Object.keys(statusDetails).map((status) => ({
    status,
  }));
}

type StatusPageProps = {
  params: Promise<{
    status: string;
  }>;
};

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

export default async function StatusPage({
  params,
}: StatusPageProps) {
  const { status } = await params;

  if (!(status in statusDetails)) {
    notFound();
  }

  const statusKey = status as Status;
  const details = statusDetails[statusKey];

  return (
    <PageContainer>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Help & Status Reference
          </p>

          <h1 className="mt-1 text-2xl font-semibold text-foreground">
            {details.title}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Reference information for the{" "}
            <span className="font-medium">
              {formatStatus(statusKey)}
            </span>{" "}
            batch status.
          </p>
        </div>

        <Link
          href="/help/status"
          className="inline-flex h-9 w-fit items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
        >
          All statuses
        </Link>
      </div>

      <Card className="mt-6 p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Status
          </p>

          <p className="mt-1 font-mono text-sm font-semibold text-foreground">
            {statusKey}
          </p>
        </div>

        <div className="mt-6">
          <h2 className="font-semibold text-foreground">
            What it means
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {details.description}
          </p>
        </div>

        {"note" in details ? (
          <div className="mt-6 rounded-md border border-border bg-surface-muted p-4">
            <p className="text-sm font-medium text-foreground">
              Important
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              {details.note}
            </p>
          </div>
        ) : null}

        {"examples" in details ? (
          <div className="mt-6">
            <h2 className="font-semibold text-foreground">
              Examples
            </h2>

            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
              {details.examples.map((example) => (
                <li key={example}>{example}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>
    </PageContainer>
  );
}