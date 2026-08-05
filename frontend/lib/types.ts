export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  referralCode?: string;
  referral_code?: string;
  referredBy?: string;
  kycStatus?: string;
  kyc_status?: string;
  status?: string;
  role?: string;
  createdAt?: string;
  created_at?: string;
  bank_account?: string;
  ifsc?: string;
  [key: string]: unknown;
}

export interface Transaction {
  id: string;
  userId?: string;
  user_id?: string;
  amount: number;
  type: string;
  source: string;
  description?: string;
  status: string;
  createdAt?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface Withdrawal {
  id: string;
  userId?: string;
  user_id?: string;
  amount: number;
  amount_requested?: number;
  tds_amount?: number;
  admin_charge?: number;
  net_amount?: number;
  status: string;
  payment_method?: string;
  payment_details?: Record<string, unknown>;
  transaction_id?: string;
  rejection_reason?: string;
  processed_at?: string;
  created_at?: string;
  createdAt?: string;
  user?: unknown;
  [key: string]: unknown;
}

export interface Investment {
  id: string;
  userId?: string;
  user_id?: string;
  amount: number;
  status: string;
  daily_rate_pct?: number;
  current_roi_amount?: number;
  max_roi_amount?: number;
  total_withdrawn?: number;
  started_at?: string;
  created_at?: string;
  days_active?: number;
  working_cap_at_creation?: boolean;
  total_reward_earned?: number;
  cap_limit?: number;
  planName?: string;
  dailyRoi?: number;
  [key: string]: unknown;
}

export interface KycRequest {
  id: string;
  userId?: string;
  user_id?: string;
  status: string;
  document_type?: string;
  document_number?: string;
  document_url?: string;
  created_at?: string;
  user?: unknown;
  [key: string]: unknown;
}

export interface TeamDirect {
  id: string;
  name?: string;
  email?: string;
  is_active?: boolean;
  leg?: string;
  total_investment?: number;
  joined_at?: string;
  createdAt?: string;
  created_at?: string;
  level?: string;
  status?: string;
  investment?: number;
  [key: string]: unknown;
}

export interface TeamLevelSummary {
  level: number;
  total_members: number;
  inactive_count: number;
  non_working_count: number;
  working_count: number;
  total_investment: number;
  lifetime_income: number;
}

export interface TeamMemberDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  invite_code: string;
  leg: string;
  status: "INACTIVE" | "ACTIVE" | "WORKING";
  level: number;
  total_investment: number;
  lifetime_income: number;
  direct_active_count: number;
  created_at: string;
}

export interface TeamBreakdown {
  levels: TeamLevelSummary[];
  members: TeamMemberDetail[];
}

export interface PlatformSettings {
  id?: number;
  monthly_reward_pct: number;
  withdrawal_min_amount: number;
  non_working_cap_multiplier: number;
  working_cap_multiplier: number;
  level1_to_5_business: number;
  level6_to_10_business: number;
  level11_to_15_business: number;
  invite_reward_l1_pct: number;
  invite_reward_l2_pct: number;
  invite_reward_l3_pct: number;
  level_income_l1_pct: number;
  level_income_l2_pct: number;
  level_income_l3_pct: number;
  level_income_l4_to_l10_pct: number;
  level_income_l11_to_l15_pct: number;
  [key: string]: any;
}
