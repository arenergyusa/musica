/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  AlertCircle, 
  TrendingUp, 
  Users, 
  Briefcase, 
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
  Clock
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store/useAuthStore";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RewardWalletCard } from "@/components/shared/RewardWalletCard";
import { StatCard } from "@/components/shared/StatCard";
import { Transaction } from "@/lib/types";
import dynamic from "next/dynamic";
const IncomeChartWrapper = dynamic(() => import("@/components/charts/IncomeChartWrapper").then(mod => mod.IncomeChartWrapper), { ssr: false, loading: () => <Skeleton className="h-[300px] w-full rounded-xl" /> });

export default function DashboardPage() {
  const { user, fetchUser } = useAuthStore();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        await fetchUser(); // Refresh user state (KYC status etc.)
        const response = await api.get("/user/dashboard");
        setDashboardData(response.data.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const kycStatus = user?.kycStatus || "UNINITIALIZED";

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const wallet = dashboardData?.wallet || { balance: 0, total_credited: 0, total_withdrawn: 0 };
  const investments = dashboardData?.investments || { active_amount: 0, total_plans: 0 };
  const team = dashboardData?.team || { direct_count: 0, active_volume: 0 };
  const transactions = dashboardData?.recent_transactions || [];
  const chartData = dashboardData?.chart_data || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* KYC Alert Banner */}
      {kycStatus !== "APPROVED" && (
        <Alert variant={kycStatus === "REJECTED" ? "destructive" : "default"} className="bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-500">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-base font-semibold">
            {kycStatus === "PENDING" ? "KYC Verification Pending" : "Complete your KYC"}
          </AlertTitle>
          <AlertDescription className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p>
              {kycStatus === "PENDING" 
                ? "Your documents are under review. You will be able to invest once approved." 
                : "You need to complete your KYC verification (Aadhaar & PAN) before you can start investing in Musica."}
            </p>
            <Link 
              href="/kyc"
              className={buttonVariants({ variant: "outline", size: "sm", className: "shrink-0 bg-background hover:bg-background/90 text-foreground" })}
            >
              {kycStatus === "PENDING" ? "Check Status" : "Complete KYC Now"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Reward Wallet */}
      <RewardWalletCard 
        balance={wallet.balance} 
        totalEarned={wallet.total_credited} 
        totalWithdrawn={wallet.total_withdrawn} 
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard 
          title="Total Credited"
          value={wallet.total_credited}
          isCurrency
          icon={TrendingUp}
        />
        <StatCard 
          title="Direct Referrals"
          value={team.direct_count}
          icon={Users}
        />
        <StatCard 
          title="Team Active Volume"
          value={team.active_volume}
          isCurrency
          icon={TrendingUp}
        />
        <StatCard 
          title="Active Investments"
          value={investments.total_plans}
          icon={Briefcase}
          description={`Total ${formatCurrency(investments.active_amount)} invested`}
        />
      </div>
      
      {/* Income Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Income Overview (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <IncomeChartWrapper data={chartData} />
        </CardContent>
      </Card>

      {/* Team Summary & Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Team Summary */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center justify-between">
                My Team Structure
                <Link href="/team" className={buttonVariants({ variant: "ghost", size: "sm", className: "-mr-3" })}>
                  View All
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center text-sm font-medium">
                    <Users className="h-4 w-4 mr-2 text-primary" /> Direct Referrals
                  </div>
                  <span className="font-bold">{team.direct_count}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center text-sm font-medium">
                    <Briefcase className="h-4 w-4 mr-2 text-emerald-500" /> Active Volume
                  </div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(team.active_volume)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center justify-between">
                Recent Transactions
                <Link href="/wallet" className={buttonVariants({ variant: "ghost", size: "sm", className: "-mr-3" })}>
                  History
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.length > 0 ? transactions.map((tx: Transaction) => (
                  <div key={tx.id} className="flex items-center justify-between pb-4 border-b border-border/40 last:border-0 last:pb-0">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${
                        tx.type === 'CREDIT' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'
                      }`}>
                        {tx.type === 'CREDIT' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium truncate max-w-[120px] sm:max-w-[200px]">{tx.description || tx.type}</p>
                        <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(tx.created_at || '').toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${
                        tx.type === 'CREDIT' ? 'text-emerald-500' : 'text-foreground'
                      }`}>
                        {tx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                      <Badge variant="outline" className="mt-1 text-[10px] h-4 py-0 px-1 border-emerald-500/30 text-emerald-600">
                        COMPLETED
                      </Badge>
                    </div>
                  </div>
                )) : (
                  <div className="text-center text-muted-foreground text-sm py-6">
                    No recent transactions found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

      </div>
    </div>
  );
}
