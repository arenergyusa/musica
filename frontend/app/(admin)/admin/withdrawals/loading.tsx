import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminWithdrawalsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header Banner Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl border border-slate-800">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-48 bg-slate-700/50" />
          <Skeleton className="h-8 w-64 bg-slate-700/50" />
          <Skeleton className="h-3 w-96 bg-slate-700/50" />
        </div>
        <Skeleton className="h-9 w-36 rounded-xl bg-slate-700/50" />
      </div>

      {/* Main Table Card Skeleton */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">

        {/* Filter Controls & Tabs Skeleton */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-9 w-28 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-9 w-full sm:w-64 rounded-lg" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-40 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        </div>

        <CardContent className="p-0">
          <div className="border-b bg-slate-50/50 dark:bg-slate-800/50 p-4 flex gap-4">
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24 mx-auto" />
            <Skeleton className="h-4 w-24 mx-auto" />
            <Skeleton className="h-4 w-32 mx-auto" />
            <Skeleton className="h-4 w-24 mx-auto" />
            <Skeleton className="h-4 w-16 ml-auto" />
          </div>
          <div className="p-4 space-y-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex gap-4 items-center justify-between">
                <Skeleton className="h-4 w-4 rounded-sm" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-4 w-20" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-md ml-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}