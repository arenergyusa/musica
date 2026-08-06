"use client";

import { useState, useEffect } from "react";
import { Zap } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store/useAuthStore";

import { Skeleton } from "@/components/ui/skeleton";
import { RewardWalletCard } from "@/components/shared/RewardWalletCard";
import { SalaryProgressCard } from "@/components/shared/SalaryProgressCard";
// import { OnboardingTour } from "@/components/shared/OnboardingTour";
import { Transaction } from "@/lib/types";

// ─── Animation Variants ──────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export default function DashboardPage() {
  const { user, fetchUser } = useAuthStore();
  const [dashboardData, setDashboardData] = useState<{
    wallet?: { balance: number; total_credited: number; total_withdrawn: number; salary_income?: number };
    investments?: { active_amount: number; active_count?: number; total_plans: number };
    team?: { direct_count: number; active_volume: number; is_working: boolean; levels_unlocked: number; status: string };
    recent_transactions?: Transaction[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        await fetchUser();
        const response = await api.get("/user/dashboard");
        setDashboardData(response.data.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboard();
  }, [fetchUser]);

  if (isLoading) {
    return (
      <div className="space-y-6 p-2 sm:p-4 animate-pulse">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  const wallet = dashboardData?.wallet || { balance: 0, total_credited: 0, total_withdrawn: 0 };
  const investments = dashboardData?.investments || { active_amount: 0, total_plans: 0 };
  const team = dashboardData?.team || { direct_count: 0, active_volume: 0, is_working: false, levels_unlocked: 0, status: "INACTIVE" };
  const levelsUnlocked = team.levels_unlocked || 0;
  const accountStatus: "INACTIVE" | "ACTIVE" | "WORKING" = team.status === "WORKING" ? "WORKING" : team.status === "ACTIVE" ? "ACTIVE" : "INACTIVE";

  const userName = user?.name ? user.name.split(' ')[0] : "User";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-8 text-slate-900 dark:text-slate-100"
    >
      {/* Interactive Onboarding Tour 
      <OnboardingTour />
*/}
      {/* Welcome Header Card */}
      <motion.div variants={itemVariants}>
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 sm:p-7 text-white shadow-lg border border-slate-800">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, <span className="text-blue-400">{userName}</span>!
            </h1>
            {accountStatus === "WORKING" && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                <Zap className="h-3.5 w-3.5 text-emerald-400" /> Working
              </span>
            )}
            {accountStatus === "ACTIVE" && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                <Zap className="h-3.5 w-3.5 text-blue-400" /> Active
              </span>
            )}
            {accountStatus === "INACTIVE" && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                <Zap className="h-3.5 w-3.5 text-amber-400" /> Inactive
              </span>
            )}
          </div>
        </div>
      </motion.div>



      {/* Core Wallet Card */}
      <motion.div variants={itemVariants}>
        <RewardWalletCard
          balance={wallet.balance}
          totalEarned={wallet.total_credited}
          totalWithdrawn={wallet.total_withdrawn}
          salaryIncome={wallet.salary_income ?? 0}
        />
      </motion.div>

      {/* Monthly Salary Progress Visualizer */}
      <motion.div variants={itemVariants}>
        <SalaryProgressCard />
      </motion.div>

    </motion.div>
  );
}
