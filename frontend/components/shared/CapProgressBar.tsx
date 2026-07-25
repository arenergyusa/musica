"use client";

import { formatCurrency, cn } from "@/lib/utils";

interface CapProgressBarProps {
  currentAmount: number;
  maxCapAmount: number;
  label?: string;
  className?: string;
  showDetails?: boolean;
}

export function CapProgressBar({
  currentAmount,
  maxCapAmount,
  label = "Progress",
  className,
  showDetails = true
}: CapProgressBarProps) {
  // Calculate percentage safely
  const percentage = maxCapAmount > 0
    ? Math.min(Math.max((currentAmount / maxCapAmount) * 100, 0), 100)
    : 0;

  const remaining = Math.max(maxCapAmount - currentAmount, 0);
  const isCompleted = percentage >= 100;

  // Determine color based on progress tier
  let progressColorClass = "bg-blue-600";
  if (isCompleted) {
    progressColorClass = "bg-rose-600 dark:bg-rose-500";
  } else if (percentage >= 80) {
    progressColorClass = "bg-amber-500";
  } else if (percentage >= 50) {
    progressColorClass = "bg-emerald-500";
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex justify-between items-center text-xs font-semibold">
        <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
          <span>{label}:</span>
          <span className="font-extrabold text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(currentAmount)}
          </span>
        </span>
        <span className={cn(
          "font-bold tabular-nums text-xs px-2 py-0.5 rounded-full border",
          isCompleted
            ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200"
            : percentage >= 80
              ? "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200"
              : "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-200"
        )}>
          {percentage.toFixed(1)}%
        </span>
      </div>

      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={cn("h-full w-full flex-1 transition-all duration-500 rounded-full", progressColorClass)}
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </div>

      {showDetails && (
        <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-400 font-medium">
          <span>Limit: <strong className="text-slate-700 dark:text-slate-300 font-bold">{formatCurrency(maxCapAmount)}</strong></span>
          <span>{isCompleted ? "Reached" : `Remaining: ${formatCurrency(remaining)}`}</span>
        </div>
      )}
    </div>
  );
}
