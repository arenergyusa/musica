import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header Banner Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl border border-slate-800">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-40 bg-slate-700/50" />
          <Skeleton className="h-8 w-56 bg-slate-700/50" />
          <Skeleton className="h-3 w-96 bg-slate-700/50" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-40 rounded-xl bg-slate-700/50" />
          <Skeleton className="h-9 w-36 rounded-xl bg-slate-700/50" />
        </div>
      </div>

      {/* Action Required Alert Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <Card key={i} className="bg-amber-500/5 dark:bg-amber-950/10 border border-amber-500/20 dark:border-amber-900/40 rounded-xl shadow-sm">
            <CardContent className="p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
              <Skeleton className="h-8 w-24 rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* HD Wallet Balance Skeleton */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
        <CardContent className="p-5">
          <Skeleton className="h-3 w-40 mb-2" />
          <Skeleton className="h-7 w-72" />
          <Skeleton className="h-3 w-64 mt-2" />
        </CardContent>
      </Card>

      {/* Top Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-8 w-32" />
                </div>
                <Skeleton className="h-10 w-10 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
            <div className="p-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-52" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            </div>
            <CardContent className="pt-4">
              <Skeleton className="h-[210px] w-full rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity Tables Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
            <CardContent className="p-0">
              <div className="border-b bg-slate-50/50 dark:bg-slate-800/50 p-4 flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="p-4 space-y-5">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
}