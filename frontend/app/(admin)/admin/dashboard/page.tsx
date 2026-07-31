"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/lib/api";
import { User, Withdrawal } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Wallet, 
  Activity, 
  Clock, 
  ArrowUpRight,
  TrendingUp,
  Settings,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  CircleDollarSign
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AnalyticsTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

const AnalyticsTooltip = ({ active, payload, label }: AnalyticsTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-xl text-xs text-white">
        <p className="font-bold text-slate-400 mb-1">{label}</p>
        {payload.map((p) => {
          const isCurrency = p.name?.toLowerCase().includes("roi") || p.name?.toLowerCase().includes("paid") || p.name?.toLowerCase().includes("amount");
          return (
            <p key={p.name} style={{ color: p.color }} className="font-black font-mono">
              {p.name}: {isCurrency ? formatCurrency(p.value) : p.value}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeInvestments: 0,
    pendingInvestments: 0,
    totalInvested: 0,
    totalPaid: 0,
    pendingWithdrawals: 0,
  });
  
  const [analytics, setAnalytics] = useState<{
    daily_signups: Array<{ date: string; count: number }>;
    daily_roi_paid: Array<{ date: string; amount: number }>;
  }>({
    daily_signups: [],
    daily_roi_paid: [],
  });

  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentWithdrawals, setRecentWithdrawals] = useState<Withdrawal[]>([]);
  const [masterWallet, setMasterWallet] = useState<{ address: string; bnb: number; usdt: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [res, usersRes, withdrawalsRes, walletRes, analyticsRes] = await Promise.all([
          api.get("/admin/dashboard"),
          api.get("/admin/users"),
          api.get("/admin/withdrawals"),
          api.get("/admin/wallet/balance").catch(() => ({ data: { data: null } })),
          api.get("/admin/analytics").catch(() => ({ data: { data: null } })),
        ]);

        if (res.data.data) {
          setStats(res.data.data);
        }
        if (usersRes.data.data) {
          setRecentUsers(usersRes.data.data.slice(0, 5));
        }
        if (withdrawalsRes.data.data) {
          setRecentWithdrawals(withdrawalsRes.data.data.slice(0, 5));
        }
        if (walletRes.data.data) setMasterWallet(walletRes.data.data);
        if (analyticsRes.data.data) {
          setAnalytics(analyticsRes.data.data);
        }
      } catch (err) {
        console.error("Failed to load admin stats", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  const signupData = analytics.daily_signups || [];
  const roiData = analytics.daily_roi_paid || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl text-white shadow-lg border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold text-blue-400 uppercase tracking-widest mb-1">
            <Sparkles className="h-3.5 w-3.5" /> Platform Intelligence
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Admin Overview</h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor overall volume, active investments, user growth, and payout queues.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/settings">
            <Button variant="outline" size="sm" className="bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700 text-xs font-bold rounded-xl h-9">
              <Settings className="mr-2 h-3.5 w-3.5" />
              Platform Settings
            </Button>
          </Link>
          <Link href="/admin/withdrawals">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl h-9 shadow-md">
              <ArrowUpRight className="mr-1.5 h-4 w-4" />
              Withdrawal Queue
            </Button>
          </Link>
        </div>
      </div>

      {/* Action Required Alert Cards */}
      {(stats.pendingWithdrawals > 0 || stats.pendingInvestments > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.pendingWithdrawals > 0 && (
            <Card className="bg-amber-500/10 border-amber-500/30 rounded-xl shadow-sm">
              <CardContent className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-3 text-amber-700 dark:text-amber-400">
                  <Clock className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-extrabold text-xs uppercase tracking-wider">{stats.pendingWithdrawals} Pending Payout Requests</p>
                    <p className="text-xs opacity-80 font-medium">Review and process automated USDT BEP-20 payouts</p>
                  </div>
                </div>
                <Link href="/admin/withdrawals">
                  <Button variant="outline" size="sm" className="border-amber-500/40 text-amber-700 dark:text-amber-300 font-bold text-xs rounded-xl bg-white dark:bg-slate-900">
                    Review Queue
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {stats.pendingInvestments > 0 && (
            <Card className="bg-emerald-500/10 border-emerald-500/30 rounded-xl shadow-sm">
              <CardContent className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400">
                  <TrendingUp className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-extrabold text-xs uppercase tracking-wider">{stats.pendingInvestments} Active Subscriptions Pending</p>
                    <p className="text-xs opacity-80 font-medium">Check transaction hashes on BSC network</p>
                  </div>
                </div>
                <Link href="/admin/investments">
                  <Button variant="outline" size="sm" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-xl bg-white dark:bg-slate-900">
                    Review Queue
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Top Metric Cards */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div><p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">HD Wallet Balance (BSC)</p><p className="text-lg font-black text-slate-900 dark:text-white font-mono">{masterWallet ? `${masterWallet.usdt.toFixed(2)} USDT · ${masterWallet.bnb.toFixed(6)} BNB` : "Unavailable"}</p></div>
          {masterWallet && <p className="text-[10px] text-slate-400 font-mono break-all">{masterWallet.address}</p>}
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm hover:border-blue-500/40 transition-colors">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Registered Users</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{stats.totalUsers.toLocaleString()}</p>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 rounded-xl">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm hover:border-indigo-500/40 transition-colors">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Investments</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{stats.activeInvestments.toLocaleString()}</p>
              </div>
              <div className="p-2.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 rounded-xl">
                <Activity className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm hover:border-emerald-500/40 transition-colors">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Active Volume</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(stats.totalInvested)}</p>
              </div>
              <div className="p-2.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 rounded-xl">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm hover:border-blue-500/40 transition-colors">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Payouts Distributed</p>
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">{formatCurrency(stats.totalPaid)}</p>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 rounded-xl">
                <CircleDollarSign className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* User Signups Trend */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
          <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
                <Users className="h-4 w-4 text-blue-600" />
                30-Day User Registrations
              </CardTitle>
              <Badge variant="outline" className="text-xs font-mono font-bold text-blue-600 border-blue-500/30">
                +{signupData.reduce((a, c) => a + (c.count || 0), 0)} users
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {signupData.length > 0 ? (
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={signupData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<AnalyticsTooltip />} />
                  <Area type="monotone" dataKey="count" name="New Users" stroke="#2563eb" fillOpacity={1} fill="url(#signupGrad)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[210px] flex items-center justify-center text-slate-400 text-xs font-medium">
                No registration trend data recorded
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Interest Payout Trend */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
          <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                30-Day Daily Rewards Distributed
              </CardTitle>
              <Badge variant="outline" className="text-xs font-mono font-bold text-emerald-600 border-emerald-500/30">
                {formatCurrency(roiData.reduce((a, c) => a + (c.amount || 0), 0))}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {roiData.length > 0 ? (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={roiData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip content={<AnalyticsTooltip />} />
                  <Bar dataKey="amount" name="ROI Paid ($)" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[210px] flex items-center justify-center text-slate-400 text-xs font-medium">
                No daily payout data recorded
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Recent Activity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Payout Requests */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-white">Recent Payout Requests</CardTitle>
              <CardDescription className="text-xs text-slate-500">Latest withdrawal requests</CardDescription>
            </div>
            <Link href="/admin/withdrawals">
              <Button variant="ghost" size="sm" className="text-xs font-bold text-blue-600 hover:text-blue-700">
                View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-950/40">
                <TableRow>
                  <TableHead className="pl-6 text-xs font-bold text-slate-500">Amount</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500">Status</TableHead>
                  <TableHead className="text-right pr-6 text-xs font-bold text-slate-500">Requested</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentWithdrawals.length > 0 ? (
                  recentWithdrawals.map((wx) => (
                    <TableRow key={wx.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <TableCell className="pl-6 font-extrabold font-mono text-xs text-slate-900 dark:text-white">
                        {formatCurrency(typeof wx.amount_requested === 'number' ? wx.amount_requested : (typeof wx.amount === 'number' ? wx.amount : 0))}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] font-bold ${wx.status === "PENDING" ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"}`}>
                          {wx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6 text-slate-400 text-xs font-mono">
                        {new Date(wx.created_at || "").toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-20 text-center text-slate-400 text-xs font-medium">
                      No recent payout requests
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Registrations */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-white">Recent User Registrations</CardTitle>
              <CardDescription className="text-xs text-slate-500">Newly onboarded members</CardDescription>
            </div>
            <Link href="/admin/users">
              <Button variant="ghost" size="sm" className="text-xs font-bold text-blue-600 hover:text-blue-700">
                View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-950/40">
                <TableRow>
                  <TableHead className="pl-6 text-xs font-bold text-slate-500">Name</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500">Email</TableHead>
                  <TableHead className="text-right pr-6 text-xs font-bold text-slate-500">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.length > 0 ? (
                  recentUsers.map((usr) => (
                    <TableRow key={usr.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <TableCell className="pl-6 font-bold text-xs text-slate-900 dark:text-white">{usr.name}</TableCell>
                      <TableCell className="text-slate-500 text-xs font-mono">{usr.email}</TableCell>
                      <TableCell className="text-right pr-6 text-slate-400 text-xs font-mono">
                        {new Date((usr.createdAt as string) || (usr.created_at as string) || '').toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-20 text-center text-slate-400 text-xs font-medium">
                      No recent user signups
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
