"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, Info, CheckCircle2, Clock, XCircle } from "lucide-react";
import { WithdrawForm } from "@/components/forms/WithdrawForm";
import { api } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface WithdrawalRecord {
  id: string;
  amount_requested: number;
  tds_amount: number;
  net_amount: number;
  status: string;
  payment_ref?: string;
  created_at: string;
  processed_at?: string;
}

export default function WithdrawPage() {
  const [balance, setBalance] = useState<number>(0);
  const [history, setHistory] = useState<WithdrawalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBalanceAndHistory = async () => {
    try {
      const [balRes, histRes] = await Promise.all([
        api.get("/wallet/balance"),
        api.get("/withdrawal/history"),
      ]);
      setBalance(balRes.data.data.balance || 0);
      setHistory(histRes.data.data || []);
    } catch (error) {
      console.error("Error fetching withdrawal data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalanceAndHistory();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PROCESSED":
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30"><CheckCircle2 className="mr-1 h-3 w-3"/> Auto-Paid</Badge>;
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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Withdraw Funds (USDT BEP-20)</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Automated USDT payout directly to your saved BEP-20 wallet address.
        </p>
      </div>

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
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                    {isLoading ? "..." : formatCurrency(balance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Request USDT Payout</CardTitle>
              <CardDescription className="text-xs text-slate-500">Withdrawals execute automated transfers to your registered BEP-20 address.</CardDescription>
            </CardHeader>
            <CardContent>
              {!isLoading ? (
                <WithdrawForm availableBalance={balance} onSuccess={fetchBalanceAndHistory} />
              ) : (
                <div className="text-xs text-slate-400">Loading balance...</div>
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
                USDT Withdrawal Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <p><strong className="text-slate-900 dark:text-white">Minimum Amount:</strong> $10.00 USD.</p>
              </div>
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <p><strong className="text-slate-900 dark:text-white">Network:</strong> Binance Smart Chain (USDT BEP-20).</p>
              </div>
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <p><strong className="text-slate-900 dark:text-white">Automated Payout:</strong> Payouts process automatically upon submission.</p>
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
                <TableHead className="text-xs font-semibold text-slate-900 dark:text-white">Net Paid</TableHead>
                <TableHead className="text-xs font-semibold">Status</TableHead>
                <TableHead className="pr-5 text-right text-xs font-semibold">Transaction Ref / Tx Hash</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length > 0 ? (
                history.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="pl-5 text-xs">{new Date(record.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-xs font-mono font-bold">{formatCurrency(record.amount_requested)}</TableCell>
                    <TableCell className="text-xs font-mono font-bold text-emerald-600">{formatCurrency(record.net_amount)}</TableCell>
                    <TableCell className="text-xs">{getStatusBadge(record.status)}</TableCell>
                    <TableCell className="pr-5 text-right text-xs font-mono text-slate-500 truncate max-w-[180px]">
                      {record.payment_ref || "—"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-28 text-center text-xs text-slate-400">
                    No withdrawal requests recorded yet.
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
