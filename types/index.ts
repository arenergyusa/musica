// Musica TypeScript types

// ============================================================
// User & Auth
// ============================================================
export type KycStatus = "PENDING" | "APPROVED" | "REJECTED";
export type UserRole = "USER" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  referralCode: string;
  referredBy?: string;
  kycStatus: KycStatus;
  role: UserRole;
  isActive: boolean;
  hasBankAccount: boolean;
  createdAt: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
}

// ============================================================
// Investment
// ============================================================
export type InvestmentStatus = "PENDING" | "ACTIVE" | "CAPPED" | "CLOSED";

export interface InvestmentPlan {
  id: string;
  name: string;
  amount: number;
  monthlyReturnPct: number;
  dailyROI: number;
  dailyRatePct: number;
  badge?: string | null;
}

export interface Investment {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  amount: number;
  status: InvestmentStatus;
  totalEarned: number;
  capLimit: number;
  capProgress: number; // 0-100%
  dailyROI: number;
  isWorking: boolean;
  createdAt: string;
  closedAt?: string;
}

// ============================================================
// Wallet & Transactions
// ============================================================
export type IncomeType = "DAILY_ROI" | "REFERRAL" | "LEVEL_INCOME" | "WITHDRAWAL";

export interface RewardWallet {
  id: string;
  userId: string;
  balance: number;
  totalCredited: number;
  totalWithdrawn: number;
}

export interface Transaction {
  id: string;
  type: "CREDIT" | "DEBIT";
  incomeType: IncomeType;
  amount: number;
  description: string;
  sourceUser?: string;    // For referral/level income
  level?: number;         // For level income
  createdAt: string;
}

// ============================================================
// Withdrawal
// ============================================================
export type WithdrawalStatus = "PENDING" | "APPROVED" | "PROCESSED" | "REJECTED";

export interface Withdrawal {
  id: string;
  userId: string;
  userName?: string;      // For admin view
  amountRequested: number;
  tdsAmount: number;
  netAmount: number;
  status: WithdrawalStatus;
  paymentRef?: string;
  scheduledDate: string;
  processedAt?: string;
  adminNote?: string;
  createdAt: string;
}

// ============================================================
// Team & Referral
// ============================================================
export interface TeamStats {
  directReferrals: number;
  totalDownline: number;
  activeDownlineVolume: number;
  levelsUnlocked: number;
  nextThreshold?: number;
  nextLevelUnlock?: string;
}

export interface DownlineMember {
  id: string;
  name: string;
  level: number;
  joinedAt: string;
  investmentStatus?: InvestmentStatus;
  activeVolume: number;
  directReferrals: number;
}

export interface LevelStat {
  level: number;
  userCount: number;
  activeVolume: number;
  incomePct: number;
  todayIncome: number;
  totalIncome: number;
}

// ============================================================
// Dashboard
// ============================================================
export interface DashboardData {
  wallet: RewardWallet;
  activeInvestments: number;
  totalInvested: number;
  todayROI: number;
  totalReferralReward: number;
  totalLevelIncome: number;
  team: TeamStats;
  recentTransactions: Transaction[];
  nextWithdrawalDate: string;
}

// ============================================================
// Income
// ============================================================
export interface IncomeSummary {
  totalROI: number;
  totalReferral: number;
  totalLevelIncome: number;
  totalEarned: number;
}

export interface IncomeRecord {
  id: string;
  type: IncomeType;
  amount: number;
  description: string;
  sourceUser?: string;
  level?: number;
  date: string;
}

export interface DailyIncomeChart {
  date: string;
  roi: number;
  referral: number;
  levelIncome: number;
  total: number;
}

// ============================================================
// KYC
// ============================================================
export interface KycDocument {
  id: string;
  userId: string;
  userName?: string;
  docType: "AADHAAR_FRONT" | "AADHAAR_BACK" | "PAN";
  fileUrl: string;
  status: KycStatus;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

// ============================================================
// Admin
// ============================================================
export interface AdminStats {
  totalUsers: number;
  activeInvestments: number;
  totalInvested: number;
  totalRewardsPaid: number;
  pendingKYC: number;
  pendingWithdrawals: number;
  todayROIDistributed: number;
}

// ============================================================
// API Response Envelope
// ============================================================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
