import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function IncomeLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* PageHeader Skeleton */}
      <div>
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-80" />
      </div>

      {/* Income Statement Card Skeleton */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Skeleton className="h-5 w-56" />
          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-9 w-full sm:w-[200px] rounded-lg" />
            <Skeleton className="h-9 w-full sm:w-[160px] rounded-lg" />
          </div>
        </div>
        <CardContent className="p-0">
          <div className="border-b bg-slate-50/50 dark:bg-slate-800/50 p-4 flex gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24 mx-auto" />
            <Skeleton className="h-4 w-32 ml-auto" />
            <Skeleton className="h-4 w-20 ml-auto" />
          </div>
          <div className="p-4 space-y-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex gap-4 items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-28 rounded-full" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}