import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function InvestLoading() {
  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* PageHeader Skeleton */}
      <div>
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-4 w-72 mt-1" />
        </CardHeader>
        <CardContent className="pt-5 space-y-6">
          {/* Amount Selector Skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-11 w-11 rounded-xl" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>

          {/* Payment Summary Skeleton */}
          <div className="bg-blue-50/70 dark:bg-blue-950/40 rounded-xl p-4 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-32" />
            </div>
            <Skeleton className="h-7 w-32 rounded-full" />
          </div>

          {/* Deposit Address Skeleton */}
          <div className="bg-slate-50 dark:bg-slate-900/70 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Skeleton className="h-[126px] w-[126px] rounded-lg shrink-0" />
              <div className="space-y-2 flex-1 w-full">
                <Skeleton className="h-3.5 w-64" />
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-3 w-72" />
              </div>
            </div>
          </div>

          <Skeleton className="h-11 w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}