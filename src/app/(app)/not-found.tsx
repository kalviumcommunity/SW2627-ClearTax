import Link from "next/link";

import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <PageContainer>
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-lg p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-error-surface text-xl font-semibold text-error-foreground">
            !
          </div>

          <h1 className="mt-5 text-2xl font-semibold text-foreground">
            Resource not found
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            The reconciliation or reference import you are looking for
            doesn&apos;t exist or is no longer available.
          </p>

          <div className="mt-6 flex justify-center">
            <Button asChild>
              <Link href="/">Back to Dashboard</Link>
            </Button>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}