import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Alert Banner Skeleton */}
      <Skeleton className="h-[76px] w-full rounded-lg" />
      
      {/* Wallet Card Skeleton */}
      <Skeleton className="h-[220px] w-full rounded-xl" />

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-3" />
              <Skeleton className="h-3 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom Section Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-6 gap-6">
        <Skeleton className="col-span-full xl:col-span-4 h-[380px] rounded-xl" />
        <div className="col-span-full xl:col-span-2 space-y-6">
          <Skeleton className="h-[200px] rounded-xl" />
          <Skeleton className="h-[280px] rounded-xl" />
        </div>
      </div>
    </div>
  );
}
