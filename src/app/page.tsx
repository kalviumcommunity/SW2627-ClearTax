import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageContainer from "@/components/layout/PageContainer";

const recentReconciliations = [
  {
    id: "REC-001",
    file: "GSTR2B_August_2026.csv",
    status: "matched" as const,
    invoices: "1,248",
    date: "24 Aug 2026",
  },
  {
    id: "REC-002",
    file: "GSTR2B_July_2026.csv",
    status: "mismatched" as const,
    invoices: "986",
    date: "22 Aug 2026",
  },
  {
    id: "REC-003",
    file: "GSTR2B_June_2026.csv",
    status: "processing" as const,
    invoices: "2,104",
    date: "20 Aug 2026",
  },
];

export default function Home() {
  return (
    <PageContainer>
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage and track your bulk invoice reconciliations.
          </p>
        </div>

        <Button>
          + New Reconciliation
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <p className="text-sm text-slate-500">
            Total Reconciliations
          </p>

          <p className="mt-2 text-2xl font-semibold text-foreground">
            24
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-slate-500">
            Matched Invoices
          </p>

          <p className="mt-2 text-2xl font-semibold text-success">
            18,492
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-slate-500">
            Mismatched
          </p>

          <p className="mt-2 text-2xl font-semibold text-warning">
            1,284
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-slate-500">
            Processing
          </p>

          <p className="mt-2 text-2xl font-semibold text-info">
            3
          </p>
        </Card>
      </div>

      {/* Recent Reconciliations */}
      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-foreground">
              Recent Reconciliations
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your latest bulk reconciliation activity.
            </p>
          </div>

          <Button variant="ghost" size="sm">
            View all
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="bg-surface-muted text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">
                  Reconciliation
                </th>

                <th className="px-5 py-3 font-medium">
                  File
                </th>

                <th className="px-5 py-3 font-medium">
                  Invoices
                </th>

                <th className="px-5 py-3 font-medium">
                  Status
                </th>

                <th className="px-5 py-3 font-medium">
                  Date
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {recentReconciliations.map((reconciliation) => (
                <tr
                  key={reconciliation.id}
                  className="hover:bg-surface-muted/50"
                >
                  <td className="px-5 py-4 font-medium text-foreground">
                    {reconciliation.id}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {reconciliation.file}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {reconciliation.invoices}
                  </td>

                  <td className="px-5 py-4">
                    <Badge status={reconciliation.status} />
                  </td>

                  <td className="px-5 py-4 text-slate-500">
                    {reconciliation.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageContainer>
  );
}