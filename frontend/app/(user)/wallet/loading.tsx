import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function WalletLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card p-6 md:p-8 rounded-2xl border shadow-sm h-32 md:h-40">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-10 w-48" />
          </div>
        </div>
        <Skeleton className="h-12 w-full md:w-48 rounded-md" />
      </div>

      {/* Tabs Skeleton */}
      <Card className="border shadow-sm">
        <div className="p-4 border-b">
          <div className="flex gap-4">
            <Skeleton className="h-10 w-32 rounded-md" />
            <Skeleton className="h-10 w-32 rounded-md" />
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
        </div>
        <CardContent className="p-0">
          <div className="border-b bg-muted/30 p-4 flex gap-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24 ml-auto" />
          </div>
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 items-center">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-5 w-24 ml-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
