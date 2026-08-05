import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function TeamLoading() {
  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-0 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* PageHeader Skeleton */}
      <div>
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-80" />
      </div>

      {/* Invite Banner Skeleton */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-md overflow-hidden relative">
        <CardContent className="p-4 sm:p-6 md:p-7 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="space-y-2 w-full md:w-1/2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <Skeleton className="h-10 w-[200px] rounded-xl" />
            <Skeleton className="h-10 w-[120px] rounded-xl" />
          </div>
        </CardContent>
      </Card>

      {/* Account Status + Levels Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <Card key={i} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-11 w-11 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
              <Skeleton className="h-7 w-20 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Team Breakdown Table Skeleton */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Skeleton className="h-5 w-40" />
          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-9 w-full sm:w-[200px] rounded-xl" />
            <Skeleton className="h-9 w-full sm:w-[130px] rounded-xl" />
          </div>
        </div>
        <CardContent className="p-0">
          <div className="border-b bg-slate-50/50 dark:bg-slate-950/40 p-4 flex gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24 mx-auto" />
            <Skeleton className="h-4 w-32 ml-auto" />
          </div>
          <div className="p-4 space-y-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}