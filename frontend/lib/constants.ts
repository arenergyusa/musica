// ============================================================
// Dynamic Investment Plan Config (Multiples of $100 USD)
// ============================================================
export const DYNAMIC_PLAN_CONFIG = {
  minAmount: 100,
  maxAmount: 10000,
  stepAmount: 100,
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
// Level Opening Thresholds ($ USD Team Volume)
// ============================================================
export const LEVEL_THRESHOLDS = [
  { volume: 1000,  levels: 5,  label: "L1–L5" },
  { volume: 2000,  levels: 10, label: "L1–L10" },
  { volume: 3000,  levels: 15, label: "L1–L15" },
] as const;

// ============================================================
// Income Cap Multipliers
// ============================================================
export const CAP_MULTIPLIER = {
  ACTIVE: 2,        // 2x of invested amount (INACTIVE & ACTIVE accounts)
  WORKING: 3,       // 3x of invested amount
} as const;

// ============================================================
// Withdrawal Rules
// ============================================================
export const WITHDRAWAL = {
  MIN_AMOUNT: 10,
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
// USDT (BEP-20) On-Chain Config
// ============================================================
export const USDT = {
  CONTRACT_ADDRESS:
    process.env.NEXT_PUBLIC_USDT_CONTRACT || "0x55d398326f99059fF775485246999027B3197955",
  DECIMALS: 18,
  NETWORK_ID: 56,
  NETWORK_NAME: "Binance Smart Chain",
} as const;

// ============================================================
// App Constants
// ============================================================
export const APP = {
  NAME: "Musica",
  TAGLINE: "Official Haryanvi Music Videos.",
  DESCRIPTION: "Official Haryanvi Music Video Streaming Platform.",
  URL: "https://the-musica.com",
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
  { label: "Invest", href: "/invest", icon: "TrendingUp" },
  { label: "My Investments", href: "/investments", icon: "Briefcase" },
  { label: "Wallet", href: "/wallet", icon: "Wallet" },
  { label: "Withdraw", href: "/withdraw", icon: "ArrowDownToLine" },
  { label: "Team & Network", href: "/team", icon: "Users" },
  { label: "Income History", href: "/income", icon: "BarChart3" },
  { label: "Profile", href: "/profile", icon: "User" },
] as const;

export const ADMIN_NAV = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "LayoutDashboard" },
  { label: "Users", href: "/admin/users", icon: "Users" },
  { label: "Investments", href: "/admin/investments", icon: "TrendingUp" },
  { label: "Withdrawals", href: "/admin/withdrawals", icon: "ArrowDownToLine" },
  { label: "Settings", href: "/admin/settings", icon: "Settings" },
] as const;
