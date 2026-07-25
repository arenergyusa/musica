"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertCircle,
  TrendingUp,
  Users,
  Briefcase,
  ArrowRight,
  Zap,
  Network,
  Timer,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { LEVEL_INCOME } from "@/lib/constants";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RewardWalletCard } from "@/components/shared/RewardWalletCard";
import { StatCard } from "@/components/shared/StatCard";
import { OnboardingTour } from "@/components/shared/OnboardingTour";
import { Transaction } from "@/lib/types";

// ─── Next Settlement Countdown ──────────────────────────────────────────────
function useNextROICountdown() {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0, progress: 0 });

  useEffect(() => {
    function calc() {
      const now = new Date();
      // Settlement at 00:00 IST (18:30 UTC)
      const target = new Date(now);
      target.setUTCHours(18, 30, 0, 0);
      if (now.getTime() >= target.getTime()) {
        target.setUTCDate(target.getUTCDate() + 1);
      }
      const totalMs = 24 * 3600 * 1000;
      const diff = Math.max(0, target.getTime() - now.getTime());
      const elapsed = totalMs - diff;
      const progress = Math.min(100, Math.max(0, (elapsed / totalMs) * 100));

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ h, m, s, progress });
    }
    calc();
    const timer = setInterval(calc, 1000);
    return () => clearInterval(timer);
  }, []);

  return timeLeft;
}

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
    wallet?: { balance: number; total_credited: number; total_withdrawn: number };
    investments?: { active_amount: number; active_count?: number; total_plans: number };
    team?: { direct_count: number; active_volume: number; is_working: boolean; levels_unlocked: number };
    recent_transactions?: Transaction[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const countdown = useNextROICountdown();

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

  const kycStatus = user?.kycStatus || "UNINITIALIZED";

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
  const team = dashboardData?.team || { direct_count: 0, active_volume: 0, is_working: false, levels_unlocked: 0 };
  const isWorking = team.is_working || false;
  const levelsUnlocked = team.levels_unlocked || 0;

  const userName = user?.name ? user.name.split(' ')[0] : "User";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-8 text-slate-900 dark:text-slate-100"
    >
      {/* Interactive Onboarding Tour */}
      <OnboardingTour />

      {/* Welcome Header Card */}
      <motion.div variants={itemVariants}>
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 sm:p-7 text-white shadow-lg border border-slate-800">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, <span className="text-blue-400">{userName}</span>!
            </h1>
            {isWorking && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                <Zap className="h-3.5 w-3.5 text-emerald-400" /> Active
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* KYC Alert Banner */}
      <AnimatePresence>
        {kycStatus !== "APPROVED" && (
          <motion.div variants={itemVariants} exit={{ opacity: 0, height: 0 }}>
            <Alert variant={kycStatus === "REJECTED" ? "destructive" : "default"} className="bg-amber-50/90 dark:bg-amber-950/30 text-amber-900 dark:text-amber-100 border border-amber-200/80 dark:border-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg shadow-sm gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/60 rounded-lg shrink-0 text-amber-600 dark:text-amber-300">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <AlertTitle className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    {kycStatus === "PENDING" ? "KYC Verification Under Review" : "Identity Verification Required"}
                  </AlertTitle>
                  <AlertDescription className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    {kycStatus === "PENDING"
                      ? "Your Aadhaar & PAN details are under review by compliance team."
                      : "Complete government identity verification to enable instant bank payouts."}
                  </AlertDescription>
                </div>
              </div>
              <Link
                href="/kyc"
                className={buttonVariants({ size: "sm", className: "shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg px-4 py-2 shadow-sm" })}
              >
                {kycStatus === "PENDING" ? "Check Verification" : "Verify KYC Now"}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Core Reward Wallet Card */}
      <motion.div variants={itemVariants}>
        <RewardWalletCard
          balance={wallet.balance}
          totalEarned={wallet.total_credited}
          totalWithdrawn={wallet.total_withdrawn}
        />
      </motion.div>

      {/* Status Badges & Settlement Countdown Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Sponsorship Tier Card */}
        <Card className={`border rounded-lg shadow-sm transition-all ${isWorking ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60" : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800"}`}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${isWorking ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"}`}>
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Working Status</p>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {isWorking ? "Working" : "No-working"}
                </p>
              </div>
            </div>
            {levelsUnlocked > 0 && (
              <Badge variant="outline" className="border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 text-xs font-bold rounded-md px-2.5 py-1">
                L1–L{levelsUnlocked} Active
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Daily Settlement Countdown Card */}
        <Card className="border border-blue-200/80 dark:border-blue-900/60 bg-gradient-to-r from-blue-50/60 to-slate-50/60 dark:from-blue-950/30 dark:to-slate-900 rounded-lg shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-600 text-white shadow-sm">
                <Timer className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Next Settlement</p>
                <span className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400 tabular-nums">
                  {String(countdown.h).padStart(2, "0")}:{String(countdown.m).padStart(2, "0")}:{String(countdown.s).padStart(2, "0")}
                </span>
              </div>
            </div>

            <div className="w-20 text-right">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Cycle</span>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${countdown.progress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Top Metric Cards (without bottom description text or trend badges) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Credited Revenue"
          value={wallet.total_credited}
          isCurrency
          icon={TrendingUp}
        />
        <StatCard
          title="Direct Team Members"
          value={team.direct_count}
          icon={Users}
        />
        <StatCard
          title="Network Sponsorship Volume"
          value={team.active_volume}
          isCurrency
          icon={Network}
        />
        <StatCard
          title="Active Sponsorships"
          value={investments.active_count ?? investments.total_plans}
          icon={Briefcase}
        />
      </motion.div>

      {/* Level Stream Revenue Distribution — Rendered if levels unlocked */}
      {levelsUnlocked > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="shadow-sm bg-gradient-to-r from-blue-50/50 via-white to-emerald-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 border border-blue-200/80 dark:border-blue-900/60 rounded-lg">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Network className="h-4 w-4 text-blue-600" />
                    Unlocked Sponsorship Levels — L1 to L{levelsUnlocked}
                  </h3>
                </div>
                <Link href="/income" className={buttonVariants({ variant: "outline", size: "sm", className: "shrink-0 border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-50 font-bold rounded-lg text-xs" })}>
                  View Income Breakdown
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((l) => (
                  <div key={l} className={`text-center p-2.5 rounded-lg border text-xs font-semibold transition-all ${l <= levelsUnlocked ? 'bg-blue-50/80 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-100 dark:border-slate-800 opacity-40'}`}>
                    <div className="font-mono font-bold text-sm">Level {l}</div>
                    <div className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">{LEVEL_INCOME[l as keyof typeof LEVEL_INCOME]}% Share</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

    </motion.div>
  );
}
