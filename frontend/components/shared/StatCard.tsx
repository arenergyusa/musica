import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  isCurrency?: boolean;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  progressPct?: number;
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  isCurrency = false,
  trend,
  progressPct,
  className 
}: StatCardProps) {
  
  const displayValue = isCurrency && typeof value === 'number' 
    ? formatCurrency(value) 
    : value;

  return (
    <Card className={cn(
      "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900 transition-all duration-200 relative overflow-hidden group",
      className
    )}>
      {/* Subtle Sky-Blue Depth Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/20 opacity-90 pointer-events-none" />
      
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
        <CardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </CardTitle>
        <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-lg text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10">
        <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
          {displayValue}
        </div>
        
        {(description || trend || progressPct !== undefined) && (
          <div className="mt-2.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              {trend && (
                <span className={cn(
                  "font-semibold px-2 py-0.5 rounded-full text-[11px] inline-flex items-center gap-0.5",
                  trend.isPositive 
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900" 
                    : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900"
                )}>
                  {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                </span>
              )}
              {description && (
                <span className="text-slate-500 dark:text-slate-400 truncate text-[11px] font-medium">{description}</span>
              )}
            </div>

            {/* Visual Micro Progress Bar */}
            {progressPct !== undefined && (
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }} 
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
