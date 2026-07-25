// ============================================================
// Dynamic Subscription Plan Config (Multiples of ₹10,000)
// ============================================================
export const DYNAMIC_PLAN_CONFIG = {
  minAmount: 10000,
  maxAmount: 1000000,
  stepAmount: 10000,
  dailyRatePct: 0.3333,
} as const;

// ============================================================
// Referral Reward Percentages (one-time on downline invest)
// ============================================================
export const REFERRAL_REWARDS: Record<number, number> = {
  1: 4,   // L1 = 4%
  2: 1,   // L2 = 1%
  3: 1,   // L3 = 1%
};

// ============================================================
// Level Income Percentages (% of downline's interest)
// ============================================================
export const LEVEL_INCOME: Record<number, number> = {
  1: 15,
  2: 10,
  3: 5,
  4: 2.5,
  5: 2.5,
  6: 2.5,
  7: 2.5,
  8: 2.5,
  9: 2.5,
  10: 2.5,
  11: 3,
  12: 3,
  13: 3,
  14: 3,
  15: 3,
};

// ============================================================
// Level Opening Thresholds
// ============================================================
export const LEVEL_THRESHOLDS = [
  { volume: 100000,  levels: 5,  label: "L1–L5" },
  { volume: 200000,  levels: 10, label: "L1–L10" },
  { volume: 300000,  levels: 15, label: "L1–L15" },
] as const;

// ============================================================
// Income Cap Multipliers
// ============================================================
export const CAP_MULTIPLIER = {
  NON_WORKING: 2,   // 2x of invested amount
  WORKING: 3,       // 3x of invested amount
} as const;

// ============================================================
// Withdrawal Rules
// ============================================================
export const WITHDRAWAL = {
  MIN_AMOUNT: 1000,
  TDS_PCT: 10,
  ADMIN_FEE_PCT: 0,
  DATES: [10, 20, 30], // Day of month
} as const;

// ============================================================
// KYC Status
// ============================================================
export const KYC_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

// ============================================================
// Investment Status
// ============================================================
export const INVESTMENT_STATUS = {
  PENDING: "PENDING",     // Payment not confirmed yet
  ACTIVE: "ACTIVE",       // Running, earning ROI
  CAPPED: "CAPPED",       // Cap reached, auto-closed
  CLOSED: "CLOSED",       // Manually closed
} as const;

// ============================================================
// Withdrawal Status
// ============================================================
export const WITHDRAWAL_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  PROCESSED: "PROCESSED",
  REJECTED: "REJECTED",
} as const;

// ============================================================
// Income Types
// ============================================================
export const INCOME_TYPE = {
  DAILY_ROI: "DAILY_ROI",
  REFERRAL: "REFERRAL",
  LEVEL_INCOME: "LEVEL_INCOME",
  WITHDRAWAL: "WITHDRAWAL",
} as const;

// ============================================================
// App Constants
// ============================================================
export const APP = {
  NAME: "Musica",
  TAGLINE: "Pure Desi Haryanvi Music Videos.",
  DESCRIPTION: "Official Haryanvi Music Video Streaming Platform by Pure Desi Music (OPC) Private Limited.",
  URL: "https://themusica.in",
  CURRENCY: "INR",
  LOCALE: "en-IN",
} as const;

// ============================================================
// Navigation Links
// ============================================================
export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "FAQ", href: "/#faq" },
] as const;

export const USER_NAV = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Sponsor Project", href: "/invest", icon: "TrendingUp" },
  { label: "My Sponsorships", href: "/investments", icon: "Wallet" },
  { label: "Reward Wallet", href: "/wallet", icon: "IndianRupee" },
  { label: "Withdraw", href: "/withdraw", icon: "ArrowDownToLine" },
  { label: "Team & Network", href: "/team", icon: "Users" },
  { label: "Income History", href: "/income", icon: "BarChart3" },
  { label: "Profile", href: "/profile", icon: "User" },
  { label: "KYC Verification", href: "/kyc", icon: "ShieldCheck" },
] as const;

export const ADMIN_NAV = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "LayoutDashboard" },
  { label: "Users", href: "/admin/users", icon: "Users" },
  { label: "Project Sponsorships", href: "/admin/investments", icon: "TrendingUp" },
  { label: "Withdrawals", href: "/admin/withdrawals", icon: "ArrowDownToLine" },
  { label: "KYC Review", href: "/admin/kyc", icon: "ShieldCheck" },
  { label: "Reports", href: "/admin/reports", icon: "BarChart3" },
] as const;
