/* eslint-disable */
// INR currency formatter — ALWAYS use this
export const formatINR = (amount: number, decimals = 0): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(amount);

// Short INR format (1,00,000 → ₹1L)
export const formatINRShort = (amount: number): string => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return formatINR(amount);
};

// Format number (Indian system, no currency symbol)
export const formatNumber = (n: number): string =>
  new Intl.NumberFormat("en-IN").format(n);

// Format percentage
export const formatPct = (n: number, decimals = 2): string =>
  `${n.toFixed(decimals)}%`;

// Format date (Indian format: DD MMM YYYY)
export const formatDate = (date: string | Date): string =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));

// Format date with time
export const formatDateTime = (date: string | Date): string =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));

// Mask Aadhaar (show last 4 digits)
export const maskAadhaar = (aadhaar: string): string =>
  `XXXX-XXXX-${aadhaar.slice(-4)}`;

// Mask bank account
export const maskAccount = (account: string): string =>
  `XXXX XXXX ${account.slice(-4)}`;

// Mask PAN
export const maskPAN = (pan: string): string =>
  `${pan.slice(0, 2)}XXXXX${pan.slice(-2)}`;

// Get next withdrawal dates (10th, 20th, 30th)
export const getNextWithdrawalDates = (): string[] => {
  const now = new Date();
  const dates: string[] = [];
  const days = [10, 20, 30];

  for (let i = 0; dates.length < 3; i++) {
    const month = new Date(now.getFullYear(), now.getMonth() + i, 1);
    days.forEach((day) => {
      const d = new Date(month.getFullYear(), month.getMonth(), day);
      const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
      const actualDay = Math.min(day, lastDay);
      const actual = new Date(month.getFullYear(), month.getMonth(), actualDay);
      if (actual > now && dates.length < 3) {
        dates.push(formatDate(actual));
      }
    });
  }
  return dates;
};

// Calculate daily ROI
export const calcDailyROI = (amount: number): number =>
  (amount * 0.3333) / 100;

// Calculate cap limit
export const calcCapLimit = (amount: number, isWorking: boolean): number =>
  isWorking ? amount * 3 : amount * 2;

// Cap progress percentage
export const calcCapProgress = (earned: number, cap: number): number =>
  Math.min((earned / cap) * 100, 100);

// Cap progress color
export const capProgressColor = (pct: number): string => {
  if (pct >= 90) return "text-destructive";
  if (pct >= 70) return "text-yellow-500";
  return "text-accent";
};
