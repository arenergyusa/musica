import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Single source of truth for the daily settlement time (M23). The online
// reward cron runs at 00:00 IST == 18:30 UTC, and every countdown/timer in the
// UI must agree with it.
export function nextSettlementDate(now: Date = new Date()): Date {
  const target = new Date(now);
  target.setUTCHours(18, 30, 0, 0);
  if (now.getTime() >= target.getTime()) {
    target.setUTCDate(target.getUTCDate() + 1);
  }
  return target;
}
