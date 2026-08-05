import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminUsersLoading() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header Banner Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 rounded-2xl border border-slate-800">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-32 bg-slate-700/50" />
          <Skeleton className="h-8 w-64 bg-slate-700/50" />
          <Skeleton className="h-3 w-96 bg-slate-700/50" />
        </div>
        <Skeleton className="h-9 w-32 rounded-xl bg-slate-700/50" />
      </div>

      {/* Filter & Controls Card Skeleton */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
            <Skeleton className="h-9 w-full md:w-80 rounded-xl" />
            <Skeleton className="h-9 w-full md:w-36 rounded-xl" />
          </div>
        </CardContent>
      </Card>

      {/* Users Table Skeleton */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="border-b bg-slate-50/50 dark:bg-slate-950/40 p-4 flex gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24 mx-auto" />
            <Skeleton className="h-4 w-24 mx-auto" />
            <Skeleton className="h-4 w-20 mx-auto" />
            <Skeleton className="h-4 w-20 mx-auto" />
            <Skeleton className="h-4 w-16 ml-auto" />
          </div>
          <div className="p-4 space-y-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex gap-4 items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-12 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}