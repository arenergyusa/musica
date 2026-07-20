/* eslint-disable */
"use client";

import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface CapProgressBarProps {
  currentAmount: number;
  maxCapAmount: number;
  label?: string;
  className?: string;
}

export function CapProgressBar({ 
  currentAmount, 
  maxCapAmount, 
  label = "Reward Cap Progress",
  className 
}: CapProgressBarProps) {
  // Calculate percentage safely
  const percentage = maxCapAmount > 0 
    ? Math.min(Math.max((currentAmount / maxCapAmount) * 100, 0), 100) 
    : 0;
  
  // Determine color based on progress
  let progressColorClass = "bg-primary";
  if (percentage >= 90) {
    progressColorClass = "bg-rose-500";
  } else if (percentage >= 75) {
    progressColorClass = "bg-amber-500";
  } else if (percentage >= 50) {
    progressColorClass = "bg-emerald-500";
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-end text-sm">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground">
          {percentage.toFixed(1)}%
        </span>
      </div>
      
      {/* 
        Using standard shadcn Progress component but injecting custom color variable 
        The actual Progress component in shadcn might need a custom indicator color,
        so we wrap it and pass a CSS variable if we modified the primitive, 
        or we just rely on standard primary color for now to avoid breaking shadcn updates.
        To keep it simple and compatible with standard shadcn v4, we use the default progress 
        and add an indicator class using Tailwind arbitrary variants or standard classes.
      */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full w-full flex-1 transition-all", progressColorClass)}
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatCurrency(currentAmount)} Earned</span>
        <span>{formatCurrency(maxCapAmount)} Max Cap</span>
      </div>
    </div>
  );
}
