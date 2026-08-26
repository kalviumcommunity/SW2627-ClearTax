import Link from "next/link";
import { connection } from "next/server";
import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import { getPrismaClient } from "@/lib/prisma";
import type { UploadBatchStatus } from "@/generated/prisma/client";

const statusStyles: Record<UploadBatchStatus, string> = {
  QUEUED: "bg-surface-muted text-slate-700",
  PROCESSING: "bg-info-surface text-info-foreground",
  COMPLETED: "bg-success-surface text-success-foreground",
  COMPLETED_WITH_ERRORS: "bg-warning-surface text-warning-foreground",
  FAILED: "bg-error-surface text-error-foreground",
};

function formatDate(value: Date | null) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function ReconciliationsPage() {
  await connection();

  const prisma = getPrismaClient();

  const batches = await prisma.uploadBatch.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      originalFilename: true,
      status: true,
      totalRows: true,
      processedRows: true,
      matchedRows: true,
      mismatchedRows: true,
      errorRows: true,
      createdAt: true,
      business: {
        select: {
          legalName: true,
          gstin: true,
        },
      },
      referenceImport: {
        select: {
          financialYear: true,
          returnPeriod: true,
        },
      },
    },
    take: 25,
  });

  return (
    <PageContainer>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Reconciliation History
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Persisted upload batches rendered on the server.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex h-9 w-fit items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
        >
          Back to dashboard
        </Link>
      </div>

      <Card className="mt-6 overflow-hidden">
        {batches.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-surface-muted text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">File</th>
                  <th className="px-5 py-3 font-medium">Business</th>
                  <th className="px-5 py-3 font-medium">Return Period</th>
                  <th className="px-5 py-3 font-medium">Uploaded</th>
                  <th className="px-5 py-3 font-medium">Rows</th>
                  <th className="px-5 py-3 font-medium">Result</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-surface-muted/50">
                    <td className="px-5 py-4">
                      <Link
                        href={`/reconciliations/${batch.id}`}
                        className="font-medium text-primary hover:text-primary-hover"
                      >
                        {batch.originalFilename}
                      </Link>
                      <p className="mt-1 break-all font-mono text-xs text-slate-500">
                        {batch.id}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      <p className="font-medium text-foreground">
                        {batch.business.legalName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {batch.business.gstin}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {batch.referenceImport.returnPeriod},{" "}
                      {batch.referenceImport.financialYear}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {formatDate(batch.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {batch.processedRows} / {batch.totalRows}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {batch.matchedRows} matched / {batch.mismatchedRows}{" "}
                      mismatched / {batch.errorRows} errors
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex w-fit items-center rounded-md px-2.5 py-1 text-xs font-medium ${statusStyles[batch.status]}`}
                      >
                        {formatStatus(batch.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-5 text-sm text-slate-500">
            No reconciliation batches have been persisted yet.
          </p>
        )}
      </Card>
    </PageContainer>
  );
}
