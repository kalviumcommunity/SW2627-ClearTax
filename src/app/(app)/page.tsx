import UploadProgress from "@/components/upload/UploadProgress";
import Link from "next/link";
import { connection } from "next/server";
import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import { getPrismaClient } from "@/lib/prisma";

import type {
  ReferenceImportStatus,
  UploadBatchStatus,
} from "@/generated/prisma/client";

const uploadStatusStyles: Record<UploadBatchStatus, string> = {
  QUEUED: "bg-surface-muted text-slate-700",
  PROCESSING: "bg-info-surface text-info-foreground",
  COMPLETED: "bg-success-surface text-success-foreground",
  COMPLETED_WITH_ERRORS: "bg-warning-surface text-warning-foreground",
  FAILED: "bg-error-surface text-error-foreground",
};

const importStatusStyles: Record<ReferenceImportStatus, string> = {
  QUEUED: "bg-surface-muted text-slate-700",
  PROCESSING: "bg-info-surface text-info-foreground",
  READY: "bg-success-surface text-success-foreground",
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

export default async function DashboardPage() {
  await connection();

  const prisma = getPrismaClient();

  const [
    totalUploads,
    processingUploads,
    completedUploads,
    needsAttentionUploads,
    recentBatches,
    recentImports,
  ] = await Promise.all([
    prisma.uploadBatch.count(),
    prisma.uploadBatch.count({
      where: {
        status: {
          in: ["QUEUED", "PROCESSING"],
        },
      },
    }),
    prisma.uploadBatch.count({
      where: {
        status: "COMPLETED",
      },
    }),
    prisma.uploadBatch.count({
      where: {
        OR: [
          {
            status: {
              in: ["COMPLETED_WITH_ERRORS", "FAILED"],
            },
          },
          {
            mismatchedRows: {
              gt: 0,
            },
          },
          {
            errorRows: {
              gt: 0,
            },
          },
        ],
      },
    }),
    prisma.uploadBatch.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        originalFilename: true,
        status: true,
        totalRows: true,
        matchedRows: true,
        mismatchedRows: true,
        errorRows: true,
        createdAt: true,
        business: {
          select: {
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
      take: 5,
    }),
    prisma.referenceImport.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        originalFilename: true,
        status: true,
        totalDocuments: true,
        importedDocuments: true,
        createdAt: true,
        business: {
          select: {
            gstin: true,
          },
        },
        financialYear: true,
        returnPeriod: true,
      },
      take: 5,
    }),
  ]);

  const summaryItems = [
    ["Total uploads", totalUploads],
    ["Processing", processingUploads],
    ["Completed", completedUploads],
    ["Needs attention", needsAttentionUploads],
  ];

  return (
    <PageContainer>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Server-rendered reconciliation activity from persisted batches.
          </p>
        </div>

        <Link
          href="/reconciliations"
          className="inline-flex h-9 w-fit items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          View history
        </Link>
      </div>
      <UploadProgress />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryItems.map(([label, value]) => (
          <Card key={label} className="p-5">
            <p className="text-sm text-slate-500">{label}</p>

            <p className="mt-2 text-2xl font-semibold text-foreground">
              {value}
            </p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card className="overflow-hidden">
          <div className="border-b border-border p-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-semibold text-foreground">
                Recent Reconciliation Batches
              </h2>

              <Link
                href="/reconciliations"
                className="text-sm font-medium text-primary hover:text-primary-hover"
              >
                View all
              </Link>
            </div>
          </div>

          {recentBatches.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-surface-muted text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">File</th>
                    <th className="px-5 py-3 font-medium">GSTIN</th>
                    <th className="px-5 py-3 font-medium">Period</th>
                    <th className="px-5 py-3 font-medium">Rows</th>
                    <th className="px-5 py-3 font-medium">Result</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {recentBatches.map((batch) => (
                    <tr key={batch.id} className="hover:bg-surface-muted/50">
                      <td className="px-5 py-4">
                        <Link
                          href={`/reconciliations/${batch.id}`}
                          className="font-medium text-primary hover:text-primary-hover"
                        >
                          {batch.originalFilename}
                        </Link>
                        <p className="mt-1 font-mono text-xs text-slate-500">
                          {formatDate(batch.createdAt)}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {batch.business.gstin}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {batch.referenceImport.returnPeriod},{" "}
                        {batch.referenceImport.financialYear}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {batch.totalRows}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {batch.matchedRows} matched / {batch.mismatchedRows}{" "}
                        mismatched / {batch.errorRows} errors
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex w-fit items-center rounded-md px-2.5 py-1 text-xs font-medium ${uploadStatusStyles[batch.status]}`}
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

        <Card className="overflow-hidden">
          <div className="border-b border-border p-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-semibold text-foreground">
                Reference Imports
              </h2>

              <Link
                href="/reference-imports"
                className="text-sm font-medium text-primary hover:text-primary-hover"
              >
                View all
              </Link>
            </div>
          </div>

          {recentImports.length > 0 ? (
            <div className="divide-y divide-border">
              {recentImports.map((referenceImport) => (
                <div key={referenceImport.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/reference-imports/${referenceImport.id}`}
                        className="font-medium text-primary hover:text-primary-hover"
                      >
                        {referenceImport.originalFilename}
                      </Link>

                      <p className="mt-1 text-sm text-slate-500">
                        {referenceImport.business.gstin},{" "}
                        {referenceImport.returnPeriod},{" "}
                        {referenceImport.financialYear}
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit shrink-0 items-center rounded-md px-2.5 py-1 text-xs font-medium ${importStatusStyles[referenceImport.status]}`}
                    >
                      {formatStatus(referenceImport.status)}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-slate-600">
                    {referenceImport.importedDocuments} imported from{" "}
                    {referenceImport.totalDocuments} documents
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-5 text-sm text-slate-500">
              No reference imports have been persisted yet.
            </p>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}
