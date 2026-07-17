// ============================================================
// Investment Plans (from business plan)
// ============================================================
export const INVESTMENT_PLANS = [
  {
    id: "starter",
    name: "Starter",
    amount: 10000,
    monthlyReturnPct: 10,
    dailyROI: 33.33,
    dailyRatePct: 0.3333,
    badge: null,
  },
  {
    id: "silver",
    name: "Silver",
    amount: 50000,
    monthlyReturnPct: 10,
    dailyROI: 166.67,
    dailyRatePct: 0.3333,
    badge: null,
  },
  {
    id: "gold",
    name: "Gold",
    amount: 100000,
    monthlyReturnPct: 10,
    dailyROI: 333.33,
    dailyRatePct: 0.3333,
    badge: "Most Popular",
  },
  {
    id: "platinum",
    name: "Platinum",
    amount: 250000,
    monthlyReturnPct: 10,
    dailyROI: 833.33,
    dailyRatePct: 0.3333,
    badge: null,
  },
  {
    id: "diamond",
    name: "Diamond",
    amount: 500000,
    monthlyReturnPct: 10,
    dailyROI: 1666.67,
    dailyRatePct: 0.3333,
    badge: "Premium",
  },
] as const;

// ============================================================
// Referral Reward Percentages (one-time on downline invest)
// ============================================================
export const REFERRAL_REWARDS: Record<number, number> = {
  1: 4,   // L1 = 4%
  2: 1,   // L2 = 1%
  3: 1,   // L3 = 1%
};

// ============================================================
// Level Income Percentages (% of downline's daily ROI)
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
  TAGLINE: "Invest in Entertainment. Earn Daily Rewards.",
  DESCRIPTION: "India's premier RBF Agreement-based Entertainment Production Investment Platform. Earn daily rewards up to 3x your investment.",
  URL: "https://musica.in",
  CURRENCY: "INR",
  LOCALE: "en-IN",
} as const;

// ============================================================
// Navigation Links
// ============================================================
export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Investment Plans", href: "/#plans" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Income Structure", href: "/#income" },
  { label: "FAQ", href: "/#faq" },
] as const;

export const USER_NAV = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Invest Now", href: "/invest", icon: "TrendingUp" },
  { label: "My Investments", href: "/investments", icon: "Wallet" },
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
  { label: "Investments", href: "/admin/investments", icon: "TrendingUp" },
  { label: "Withdrawals", href: "/admin/withdrawals", icon: "ArrowDownToLine" },
  { label: "KYC Review", href: "/admin/kyc", icon: "ShieldCheck" },
  { label: "Reports", href: "/admin/reports", icon: "BarChart3" },
] as const;
