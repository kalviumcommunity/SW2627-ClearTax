import Link from "next/link";
import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";

export default function ReconciliationsPage() {
  return (
    <PageContainer>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Reconciliations
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Open a saved reconciliation batch from its batch URL.
        </p>
      </div>

      <Card className="mt-6 p-5">
        <h2 className="font-semibold text-foreground">
          Saved Batch Detail
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Batch detail pages are available at stable reconciliation URLs.
        </p>

        <Link
          href="/"
          className="mt-4 inline-flex h-9 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
        >
          Back to dashboard
        </Link>
      </Card>
    </PageContainer>
  );
}
