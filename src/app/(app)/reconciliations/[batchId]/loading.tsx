import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-surface-muted ${className}`}
    />
  );
}

export default function Loading() {
  return (
    <PageContainer>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Skeleton className="h-4 w-36" />
          <Skeleton className="mt-2 h-8 w-72" />
          <Skeleton className="mt-2 h-4 w-80" />
        </div>

        <Skeleton className="h-9 w-24" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="p-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-8 w-20" />
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <Skeleton className="h-5 w-32" />

          <div className="mt-5 space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index}>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-2 h-5 w-48" />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <Skeleton className="h-5 w-36" />

          <div className="mt-5 space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index}>
                <Skeleton className="h-4 w-28" />
                <Skeleton className="mt-2 h-5 w-44" />
              </div>
            ))}
          </div>

          <Skeleton className="mt-5 h-9 w-40" />
        </Card>
      </div>
    </PageContainer>
  );
}