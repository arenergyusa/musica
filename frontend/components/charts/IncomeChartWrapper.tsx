 
"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

import type { IncomeChartProps } from "./IncomeChart";

// Dynamic import with ssr: false inside a Client Component
const IncomeChart = dynamic(() => import("./IncomeChart"), {
  loading: () => <Skeleton className="h-[380px] w-full rounded-xl" />,
  ssr: false,
});

export function IncomeChartWrapper(props: IncomeChartProps) {
  return <IncomeChart {...props} />;
}
