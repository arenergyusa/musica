import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function WithdrawLoading() {
  return (
    <div className="max-w-xl mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* PageHeader Skeleton */}
      <div>
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-80" />
      </div>

      {/* Withdrawal Form Card Skeleton */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <Skeleton className="h-5 w-56" />
        </CardHeader>
        <CardContent className="pt-5 space-y-6">
          {/* Balance Row Skeleton */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-6 w-32" />
              </div>
            </div>
            <Skeleton className="h-4 w-16" />
          </div>

          {/* Amount Input Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>

          {/* TDS Note Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>

          <Skeleton className="h-11 w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}