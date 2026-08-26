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
      <div>
        <Skeleton className="h-7 w-52" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-border p-5">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>

        <div className="space-y-4 p-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="grid gap-3 sm:grid-cols-4"
            >
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          ))}
        </div>
      </Card>
    </PageContainer>
  );
}