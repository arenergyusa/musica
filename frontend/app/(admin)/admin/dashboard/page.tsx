"use client";

import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Wallet, 
  Activity, 
  Clock, 
  ArrowRight,
  TrendingUp,
  FileWarning,
} from "lucide-react";
import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { User, Withdrawal } from "@/lib/types";

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
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
        <p className="font-medium text-foreground mb-1">{label}</p>
        {payload.map((p) => {
          const isCurrency = p.name?.toLowerCase().includes("roi") || p.name?.toLowerCase().includes("paid") || p.name?.toLowerCase().includes("amount");
          return (
            <p key={p.name} style={{ color: p.color }} className="font-bold">
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
    pendingKyc: 0,
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const [res, usersRes, withdrawalsRes, analyticsRes] = await Promise.all([
          api.get("/admin/dashboard"),
          api.get("/admin/users"),
          api.get("/admin/withdrawals"),
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
        if (analyticsRes.data.data) {
          setAnalytics(analyticsRes.data.data);
        }
      } catch (err) {
        console.error("Failed to load admin stats", err);
        setError("Unable to load dashboard data. Please try again.");
      }
    }
    loadStats();
  }, []);

  const signupData = analytics.daily_signups || [];
  const roiData = analytics.daily_roi_paid || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Admin Overview</h1>
        <p className="text-muted-foreground text-sm">
          Platform analytics, growth metrics, and pending action items.
        </p>
      </div>

      {error && (
        <Card className="bg-destructive/10 border-destructive/30">
          <CardContent className="p-4 flex items-center text-destructive">
            <div className="font-medium">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Action Required Alerts */}
      {(stats.pendingKyc > 0 || stats.pendingWithdrawals > 0 || stats.pendingInvestments > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.pendingWithdrawals > 0 && (
            <Card className="bg-amber-500/10 border-amber-500/30">
              <CardContent className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-3 text-amber-700 dark:text-amber-400">
                  <Clock className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">{stats.pendingWithdrawals} Pending Withdrawals</p>
                    <p className="text-xs opacity-80">Requires payout approval</p>
                  </div>
                </div>
                <Link href="/admin/withdrawals">
                  <Button variant="outline" size="sm" className="bg-background border-amber-500/30">
                    Review
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {stats.pendingInvestments > 0 && (
            <Card className="bg-emerald-500/10 border-emerald-500/30">
              <CardContent className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400">
                  <TrendingUp className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">{stats.pendingInvestments} Pending Subscriptions</p>
                    <p className="text-xs opacity-80">UTR payment receipts</p>
                  </div>
                </div>
                <Link href="/admin/investments">
                  <Button variant="outline" size="sm" className="bg-background border-emerald-500/30">
                    Activate
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {stats.pendingKyc > 0 && (
            <Card className="bg-blue-500/10 border-blue-500/30">
              <CardContent className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-3 text-blue-700 dark:text-blue-400">
                  <FileWarning className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">{stats.pendingKyc} Pending KYC</p>
                    <p className="text-xs opacity-80">Awaiting verification</p>
                  </div>
                </div>
                <Link href="/admin/kyc">
                  <Button variant="outline" size="sm" className="bg-background border-blue-500/30">
                    Verify
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg shadow-sm">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Registered Users</p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{stats.totalUsers.toLocaleString()}</p>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 rounded-lg">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg shadow-sm">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Sponsorships</p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{stats.activeInvestments.toLocaleString()}</p>
              </div>
              <div className="p-2.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 rounded-lg">
                <Activity className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg shadow-sm">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Active TVL</p>
                <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.totalInvested)}</p>
              </div>
              <div className="p-2.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 rounded-lg">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg shadow-sm">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Rewards Paid</p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{formatCurrency(stats.totalPaid)}</p>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 rounded-lg">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* User Signups Trend */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                30-Day User Registrations
              </span>
              <Badge variant="outline" className="text-xs font-mono">
                {signupData.reduce((a, c) => a + (c.count || 0), 0)} signups
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {signupData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={signupData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<AnalyticsTooltip />} />
                  <Area type="monotone" dataKey="count" name="New Users" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#signupGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                No registration trend data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Interest Payout Trend */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                30-Day Daily Rewards Distributed
              </span>
              <Badge variant="outline" className="text-xs font-mono text-emerald-600 border-emerald-500/30">
                +{formatCurrency(roiData.reduce((a, c) => a + (c.amount || 0), 0))}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {roiData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={roiData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip content={<AnalyticsTooltip />} />
                  <Bar dataKey="amount" name="Reward Paid" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                No daily payout data yet
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Recent Activity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Withdrawals */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Withdrawals</CardTitle>
              <CardDescription className="text-xs">Latest user payout requests</CardDescription>
            </div>
            <Link href="/admin/withdrawals">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="pl-6">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-6">Requested</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentWithdrawals.length > 0 ? (
                  recentWithdrawals.map((wx) => (
                    <TableRow key={wx.id}>
                      <TableCell className="pl-6 font-bold text-foreground">
                        {formatCurrency(typeof wx.amount_requested === 'number' ? wx.amount_requested : (typeof wx.amount === 'number' ? wx.amount : 0))}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={wx.status === "PENDING" ? "bg-amber-500/10 text-amber-600 border-amber-500/30" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"}>
                          {wx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6 text-muted-foreground text-xs">
                        {new Date(wx.created_at || "").toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-20 text-center text-muted-foreground text-xs">
                      No recent withdrawals
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Registrations */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Signups</CardTitle>
              <CardDescription className="text-xs">New user registrations</CardDescription>
            </div>
            <Link href="/admin/users">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="pl-6">Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right pr-6">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.length > 0 ? (
                  recentUsers.map((usr) => (
                    <TableRow key={usr.id}>
                      <TableCell className="pl-6 font-medium text-sm">{usr.name}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{usr.email}</TableCell>
                      <TableCell className="text-right pr-6 text-muted-foreground text-xs">
                        {new Date((usr.createdAt as string) || (usr.created_at as string) || '').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-20 text-center text-muted-foreground text-xs">
                      No recent signups
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
