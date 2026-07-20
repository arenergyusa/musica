/* eslint-disable */
"use client";

import { APP } from "@/lib/constants";
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
  FileWarning
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





export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeInvestments: 0,
    totalInvested: 0,
    totalPaid: 0,
    pendingKyc: 0,
    pendingWithdrawals: 0,
  });
  
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentWithdrawals, setRecentWithdrawals] = useState<Withdrawal[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const [res, usersRes, withdrawalsRes] = await Promise.all([
          api.get("/admin/dashboard"),
          api.get("/admin/users"),
          api.get("/admin/withdrawals"),
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
      } catch (err) {
        console.error("Failed to load admin stats", err);
        setError("Unable to load dashboard data. Please try again.");
      }
    }
    loadStats();
  }, []);
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Admin Overview</h1>
        <p className="text-muted-foreground">
          Platform performance and pending action items.
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
      {(stats.pendingKyc > 0 || stats.pendingWithdrawals > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.pendingWithdrawals > 0 && (
            <Card className="bg-amber-500/10 border-amber-500/30">
              <CardContent className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-3 text-amber-700">
                  <Clock className="h-5 w-5" />
                  <div>
                    <p className="font-semibold">{stats.pendingWithdrawals} Pending Withdrawals</p>
                    <p className="text-sm opacity-80">Requires your approval</p>
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
          {stats.pendingKyc > 0 && (
            <Card className="bg-blue-500/10 border-blue-500/30">
              <CardContent className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-3 text-blue-700">
                  <FileWarning className="h-5 w-5" />
                  <div>
                    <p className="font-semibold">{stats.pendingKyc} Pending KYC</p>
                    <p className="text-sm opacity-80">Awaiting verification</p>
                  </div>
                </div>
                <Link href="/admin/kyc">
                  <Button variant="outline" size="sm" className="bg-background border-blue-500/30">
                    Review
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Active Plans</p>
                <p className="text-2xl font-bold">{stats.activeInvestments.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-emerald-500/10 rounded-full">
                <Activity className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Invested (TVL)</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.totalInvested)}</p>
              </div>
              <div className="p-2 bg-emerald-500/10 rounded-full">
                <Wallet className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Rewards Paid</p>
                <p className="text-2xl font-bold text-rose-600">{formatCurrency(stats.totalPaid)}</p>
              </div>
              <div className="p-2 bg-rose-500/10 rounded-full">
                <TrendingUp className="h-5 w-5 text-rose-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {/* System Health / Cron Status */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Automated jobs status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-sm">Daily ROI Engine</p>
                <p className="text-xs text-muted-foreground">Runs every night at 12:00 AM</p>
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                Success
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-sm">Level Income Sync</p>
                <p className="text-xs text-muted-foreground">Runs every 5 mins</p>
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                Success
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-sm">Cap Checker</p>
                <p className="text-xs text-muted-foreground">Validates 2X/3X completion</p>
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                Success
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Withdrawals */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Withdrawals</CardTitle>
              <CardDescription>Latest pending requests</CardDescription>
            </div>
            <Link href="/admin/withdrawals">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="pl-6">User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right pr-6">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentWithdrawals.map((wx) => (
                  <TableRow key={wx.id}>
                    <TableCell className="pl-6 font-medium">{(wx.user_id as string) || (wx.userId as string)}</TableCell>
                    <TableCell className="font-bold text-foreground">{formatCurrency(wx.amount)}</TableCell>
                    <TableCell className="text-right pr-6 text-muted-foreground text-sm">{new Date(wx.created_at || "").toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Registrations */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Signups</CardTitle>
              <CardDescription>New users joined the platform</CardDescription>
            </div>
            <Link href="/admin/users">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="pl-6">Name</TableHead>
                  <TableHead>Sponsor</TableHead>
                  <TableHead className="text-right pr-6">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.map((usr) => (
                  <TableRow key={usr.id}>
                    <TableCell className="pl-6 font-medium">{usr.name}</TableCell>
                    <TableCell className="text-muted-foreground">{(usr.sponsor_id as string) || "N/A"}</TableCell>
                    <TableCell className="text-right pr-6 text-muted-foreground text-sm">{new Date((usr.createdAt as string) || (usr.created_at as string) || '').toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
