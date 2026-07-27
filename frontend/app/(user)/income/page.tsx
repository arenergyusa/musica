"use client";

import { useState, useEffect, useMemo } from "react";
import { LEVEL_INCOME } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Coins, Users, Network, Search, BarChart3, Layers, CheckCircle2, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/PageHeader";
import { Transaction } from "@/lib/types";

import { api } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const LEVEL_PCT = LEVEL_INCOME;

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white border border-slate-800 rounded-lg p-3 shadow-xl text-xs space-y-1">
        <p className="font-bold text-slate-400 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }} className="font-extrabold flex justify-between gap-4">
            <span>{p.name}:</span>
            <span>{formatCurrency(p.value)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function IncomeHistoryPage() {
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchIncome() {
      try {
        const response = await api.get("/wallet/transactions?limit=500");
        const credits = (response.data.data || []).filter((tx: Transaction) => tx.type === "CREDIT" || tx.type === "CREDITED");
        setTransactions(credits);
      } catch (error) {
        console.error("Error fetching income history:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchIncome();
  }, []);

  const stats = useMemo(() => ({
    dailyRoi: transactions.filter(t => t.source === "DAILY_ROI").reduce((acc, curr) => acc + curr.amount, 0),
    referral: transactions.filter(t => t.source === "REFERRAL").reduce((acc, curr) => acc + curr.amount, 0),
    level: transactions.filter(t => t.source === "LEVEL_INCOME").reduce((acc, curr) => acc + curr.amount, 0),
  }), [transactions]);

  const levelBreakdown = useMemo(() => {
    const levelTxs = transactions.filter(t => t.source === "LEVEL_INCOME");
    const breakdown: Record<number, { total: number; count: number }> = {};
    for (let i = 1; i <= 15; i++) {
      breakdown[i] = { total: 0, count: 0 };
    }
    levelTxs.forEach((tx) => {
      const match = tx.description?.match(/Level (\d+)/i);
      if (match) {
        const lvl = parseInt(match[1]);
        if (lvl >= 1 && lvl <= 15) {
          breakdown[lvl].total += tx.amount;
          breakdown[lvl].count += 1;
        }
      }
    });
    return breakdown;
  }, [transactions]);

  const monthlyData = useMemo(() => {
    const monthly: Record<string, { key: string; month: string; interest: number; referral: number; level: number }> = {};
    transactions.forEach((tx) => {
      if (!tx.created_at) return;
      const d = new Date(tx.created_at);
      if (isNaN(d.getTime())) return;
      const timeZone = "Asia/Kolkata";
      const year = d.toLocaleDateString("en-US", { timeZone, year: "numeric" });
      const month = d.toLocaleDateString("en-US", { timeZone, month: "2-digit" });
      const key = `${year}-${month}`;
      const label = d.toLocaleDateString("en-IN", { timeZone, month: "short", year: "2-digit" });
      if (!monthly[key]) monthly[key] = { key, month: label, interest: 0, referral: 0, level: 0 };
      if (tx.source === "DAILY_ROI") monthly[key].interest += tx.amount;
      else if (tx.source === "REFERRAL") monthly[key].referral += tx.amount;
      else if (tx.source === "LEVEL_INCOME") monthly[key].level += tx.amount;
    });
    return Object.values(monthly).sort((a, b) => a.key.localeCompare(b.key));
  }, [transactions]);

  const filteredHistory = useMemo(() => transactions.filter(tx => {
    const matchesType = typeFilter === "ALL" || tx.source === typeFilter;
    const matchesSearch = (tx.description || tx.source).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  }), [transactions, typeFilter, searchQuery]);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "DAILY_ROI":
        return <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 text-xs font-semibold">📈 Daily Revenue</Badge>;
      case "REFERRAL":
        return <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-200 text-xs font-semibold">👥 Invite Reward</Badge>;
      case "LEVEL_INCOME":
        return <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/50 text-amber-600 border-amber-200 text-xs font-semibold">🌐 Level Reward</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{type}</Badge>;
    }
  };

  const totalEarnings = stats.dailyRoi + stats.referral + stats.level;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <PageHeader title="Rewards History" />

      {/* Top Metric Cards (Subheading text removed as requested) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Daily Revenue Card */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex justify-between items-center">
              Revenue Share
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <Coins className="h-4 w-4" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(stats.dailyRoi)}
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: totalEarnings > 0 ? `${(stats.dailyRoi / totalEarnings) * 100}%` : '0%' }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Invite Rewards Card */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex justify-between items-center">
              Invite Rewards
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                <Users className="h-4 w-4" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(stats.referral)}
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: totalEarnings > 0 ? `${(stats.referral / totalEarnings) * 100}%` : '0%' }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Level Rewards Card */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex justify-between items-center">
              Level Rewards
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                <Network className="h-4 w-4" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(stats.level)}
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: totalEarnings > 0 ? `${(stats.level / totalEarnings) * 100}%` : '0%' }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level Rewards Card Matrix (Modern Visual Grid replacing plain 15-row table) */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-600" />
            Level Reward Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Array.from({ length: 15 }, (_, i) => i + 1).map((lvl) => {
              const data = levelBreakdown[lvl] || { total: 0, count: 0 };
              const pct = LEVEL_PCT[lvl as keyof typeof LEVEL_PCT] || 0;
              const hasEarnings = data.total > 0;

              return (
                <div
                  key={lvl}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-2 ${hasEarnings
                    ? "bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 shadow-xs"
                    : "bg-slate-50/60 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800 opacity-75"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                      Level {lvl}
                    </span>
                    <Badge variant="outline" className={`text-[10px] font-extrabold border ${hasEarnings
                      ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200"
                      : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}>
                      {pct}% Share
                    </Badge>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-slate-400">Total Earned</div>
                    <div className={`text-base font-extrabold tracking-tight ${hasEarnings ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"}`}>
                      {formatCurrency(data.total)}
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 font-medium">
                    {data.count > 0 ? `${data.count} payouts` : "0 payouts"}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Chart */}
      {monthlyData.length > 0 && (
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
          <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Monthly Revenue Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="interest" name="Daily Revenue" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="referral" name="Invite Reward" fill="#2563eb" stackId="a" />
                <Bar dataKey="level" name="Level Reward" fill="#f59e0b" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Detailed Transaction History Table */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white">Detailed Revenue Statement</CardTitle>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search description..."
                className="pl-9 w-full sm:w-[200px] h-9 text-xs rounded-lg border-slate-200 dark:border-slate-800"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 font-semibold text-slate-900 dark:text-white outline-none"
            >
              <option value="ALL">All Revenue Sources</option>
              <option value="DAILY_ROI">Daily Revenue</option>
              <option value="REFERRAL">Invite Reward</option>
              <option value="LEVEL_INCOME">Level Reward</option>
            </select>
          </div>
        </div>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
              <TableRow>
                <TableHead className="pl-5 text-xs font-bold text-slate-700 dark:text-slate-300">Date</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Reward Type</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Description</TableHead>
                <TableHead className="text-right pr-5 text-xs font-bold text-slate-700 dark:text-slate-300">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.length > 0 ? (
                filteredHistory.map((tx) => (
                  <TableRow key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <TableCell className="pl-5 font-medium whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                      {new Date(tx.created_at || '').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell>{getTypeBadge(tx.source)}</TableCell>
                    <TableCell className="font-semibold text-xs text-slate-900 dark:text-white max-w-[250px] truncate">
                      {tx.description || tx.source}
                    </TableCell>
                    <TableCell className="text-right pr-5 font-extrabold text-xs text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(tx.amount)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-28 text-center text-xs text-slate-400">
                    {isLoading ? "Loading income records..." : "No income records found for this filter."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}
