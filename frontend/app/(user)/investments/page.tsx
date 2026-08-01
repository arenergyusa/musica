"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { CapProgressBar } from "@/components/shared/CapProgressBar";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Investment } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Activity, Lock, Wallet, PlusCircle, ShieldCheck, TrendingUp, DollarSign } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store/useAuthStore";

export default function InvestmentsPage() {
  const { user } = useAuthStore();
  const [filter, setFilter] = useState("ALL");
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [nonWorkingCap, setNonWorkingCap] = useState<number>(2);
  const [workingCap, setWorkingCap] = useState<number>(3);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const invRes = await api.get("/investment/my");
        setInvestments(invRes.data.data || []);

        const settingsRes = await api.get("/settings");
        if (settingsRes.data?.data) {
          setNonWorkingCap(settingsRes.data.data.non_working_cap_multiplier ?? 2);
          setWorkingCap(settingsRes.data.data.working_cap_multiplier ?? 3);
        }
      } catch (error) {
        console.error("Error fetching investments:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const stats = {
    totalInvested: investments.reduce((acc, curr) => acc + curr.amount, 0),
    totalEarned: investments.reduce((acc, curr) => acc + (curr.total_reward_earned || 0), 0),
    activeCount: investments.filter(i => i.status === "ACTIVE").length,
    closedCount: investments.filter(i => i.status === "CLOSED" || i.status === "CAPPED").length,
  };

  const enrichedInvestments = investments.map(inv => {
    return {
      ...inv,
      dailyRoi: inv.daily_rate_pct ? (inv.amount * (inv.daily_rate_pct as number)) / 100 : (inv.amount * 0.3333) / 100
    };
  });

  const filteredInvestments = enrichedInvestments.filter(inv => {
    if (filter === "ALL") return true;
    if (filter === "CLOSED") return inv.status === "CLOSED" || inv.status === "CAPPED";
    return inv.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 text-xs font-semibold px-2.5 py-0.5">
            ● Active
          </Badge>
        );
      case "CAPPED":
      case "CLOSED":
        return (
          <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 text-xs font-semibold px-2.5 py-0.5">
            Closed
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/50 text-amber-600 border-amber-200 text-xs font-semibold px-2.5 py-0.5">
            ⏳ Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <PageHeader
        title="My Investments"
        action={
          <Link href="/invest">
            <Button className="h-10 text-xs font-bold px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              New Investment
            </Button>
          </Link>
        }
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Invested</p>
              <p className="text-lg font-extrabold text-slate-900 dark:text-white">{formatCurrency(stats.totalInvested)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Earned</p>
              <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.totalEarned)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Investments</p>
              <p className="text-lg font-extrabold text-slate-900 dark:text-white">{stats.activeCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Completed / Closed</p>
              <p className="text-lg font-extrabold text-slate-900 dark:text-white">{stats.closedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Control */}
      <div className="flex justify-between items-center w-full pb-2 border-b border-slate-200 dark:border-slate-800">
        <h3 className="font-bold text-base text-slate-900 dark:text-white">Investment Portfolio</h3>
        <Select value={filter} onValueChange={(val) => val && setFilter(val)}>
          <SelectTrigger className="w-[170px] text-xs h-9 rounded-lg border-slate-200 dark:border-slate-800">
            <SelectValue placeholder="All Investments">
              {{
                ALL: "All Investments",
                ACTIVE: "Active Only",
                CLOSED: "Closed Only",
                PENDING: "Pending Only"
              }[filter]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Investments</SelectItem>
            <SelectItem value="ACTIVE">Active Only</SelectItem>
            <SelectItem value="PENDING">Pending Only</SelectItem>
            <SelectItem value="CLOSED">Closed Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-full">
        {filteredInvestments.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredInvestments.map((inv) => (
              <Card key={inv.id} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                <div className={`h-1.5 w-full ${inv.status === "ACTIVE" ? "bg-gradient-to-r from-blue-500 to-blue-600" : inv.status === "PENDING" ? "bg-gradient-to-r from-amber-400 to-amber-500" : "bg-slate-300 dark:bg-slate-700"}`} />

                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Investment</CardTitle>
                      <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <Calendar className="mr-1 h-3.5 w-3.5" />
                        {new Date(inv.created_at || '').toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    {getStatusBadge(inv.status)}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 flex-grow pb-5">
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Invest Amount</p>
                      <p className="text-lg font-extrabold text-slate-900 dark:text-white">{formatCurrency(inv.amount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Daily Income</p>
                      <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">+{formatCurrency(inv.dailyRoi)}/day</p>
                    </div>
                  </div>

                  <div>
                    <CapProgressBar
                      currentAmount={inv.total_reward_earned || 0}
                      maxCapAmount={inv.cap_limit || (inv.amount * 2)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Wallet}
            title="No investments found"
            description="You do not have any investments matching this filter."
            action={
              <Link href="/invest">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold h-10 px-4">Start Investing</Button>
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
