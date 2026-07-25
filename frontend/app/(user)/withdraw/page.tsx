/* eslint-disable */
"use client";

import { useState } from "react";
import { APP } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Wallet, Landmark, AlertCircle, Info, Clock, CheckCircle2, XCircle } from "lucide-react";
import { WithdrawForm } from "@/components/forms/WithdrawForm";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useEffect } from "react";
import { api } from "@/lib/api";
const IS_BANK_VERIFIED = true; // Toggle this to test the unverified state



export default function WithdrawPage() {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBalance() {
      try {
        const response = await api.get("/wallet/balance");
        setBalance(response.data.data.balance || 0);
      } catch (error) {
        console.error("Error fetching balance:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBalance();
  }, []);
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PROCESSED":
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30"><CheckCircle2 className="mr-1 h-3 w-3"/> Processed</Badge>;
      case "PENDING":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30"><Clock className="mr-1 h-3 w-3"/> Pending</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30"><XCircle className="mr-1 h-3 w-3"/> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Withdraw Funds</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Transfer your reward balance to your verified bank account with 0% platform fee and 10% statutory TDS.
        </p>
      </div>

      {!IS_BANK_VERIFIED && (
        <Alert variant="destructive" className="rounded-lg shadow-sm">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-sm font-bold">Bank Account Not Verified</AlertTitle>
          <AlertDescription className="flex items-center justify-between mt-2 text-xs">
            <span>You need to add a verified bank account to your profile before requesting withdrawals.</span>
            <Link href="/profile">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold">
                Add Bank Details
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form & Balance */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="bg-blue-50 dark:bg-blue-950/50 p-2.5 rounded-lg text-blue-600 dark:text-blue-400">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Balance</p>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    {isLoading ? "..." : formatCurrency(balance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Submit Withdrawal Request</CardTitle>
              <CardDescription className="text-xs text-slate-500">Withdrawals are processed with 0% platform fee and 10% statutory TDS (TAN: RTKP11658D).</CardDescription>
            </CardHeader>
            <CardContent>
              {IS_BANK_VERIFIED ? (
                !isLoading ? <WithdrawForm availableBalance={balance} /> : <div className="text-xs text-slate-400">Loading balance...</div>
              ) : (
                <div className="text-center py-8 text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-dashed text-xs">
                  <Landmark className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Please complete bank verification in your profile first.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Rules Info */}
        <div className="space-y-6">
          <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                <Info className="h-4 w-4 mr-2 text-blue-600" />
                Withdrawal Terms & TDS Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <p><strong className="text-slate-900 dark:text-white">Minimum Amount:</strong> ₹1,000 per request.</p>
              </div>
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <p><strong className="text-slate-900 dark:text-white">Platform Admin Fee:</strong> 0% (Zero platform administration fee).</p>
              </div>
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <p><strong className="text-slate-900 dark:text-white">Statutory Deductions:</strong> 10% Statutory TDS deducted per Income Tax Act under TAN RTKP11658D.</p>
              </div>
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <p><strong className="text-slate-900 dark:text-white">Settlement Window:</strong> Requests processed within 24 working hours.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* History Table */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Withdrawal History</CardTitle>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
              <TableRow>
                <TableHead className="pl-5 text-xs font-semibold">Request Date</TableHead>
                <TableHead className="text-xs font-semibold">Amount</TableHead>
                <TableHead className="text-xs font-semibold">TDS (10%)</TableHead>
                <TableHead className="text-xs font-semibold text-slate-900 dark:text-white">Net Received</TableHead>
                <TableHead className="text-xs font-semibold">Status</TableHead>
                <TableHead className="pr-5 text-right text-xs font-semibold">Processed On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={6} className="h-28 text-center text-xs text-slate-400">
                  No withdrawal requests recorded yet.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}
