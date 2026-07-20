/* eslint-disable */
"use client";

import { APP } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, ArrowDownRight, ArrowUpRight, Clock, CheckCircle2, XCircle, HandCoins } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { WithdrawForm } from "@/components/forms/WithdrawForm";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Transaction, Withdrawal } from "@/lib/types";



// Helper to render status badge
const renderStatusBadge = (status: string) => {
  switch (status) {
    case "CREDITED":
    case "CREDIT":
    case "SUCCESS":
    case "PROCESSED":
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
          <CheckCircle2 className="mr-1 h-3 w-3" /> {status}
        </Badge>
      );
    case "PENDING":
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
          <Clock className="mr-1 h-3 w-3" /> {status}
        </Badge>
      );
    case "REJECTED":
    case "DEBIT":
      return (
        <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30">
          <XCircle className="mr-1 h-3 w-3" /> {status}
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [historyType, setHistoryType] = useState("daily_rewards");

  useEffect(() => {
    async function fetchData() {
      try {
        // Start non-blocking settings request
        api.get("/settings")
          .then(res => setSettings(res.data.data))
          .catch(() => setSettings(null));

        const [balRes, txRes, wdRes] = await Promise.all([
          api.get("/wallet/balance"),
          api.get("/wallet/transactions"),
          api.get("/withdrawal/history")
        ]);
        setBalance(balRes.data.data?.balance || 0);
        setTransactions(txRes.data.data || []);
        setWithdrawals(wdRes.data.data || []);
      } catch (error) {
        console.error("Failed to fetch wallet data", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const dailyRewards = transactions.filter(t => t.source === "DAILY_ROI");
  const levelIncome = transactions.filter(t => t.source === "LEVEL_INCOME" || t.source === "REFERRAL");

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Page Header & Balance */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card p-6 md:p-8 rounded-2xl border shadow-sm relative overflow-hidden">
        {/* Background gradient decorative element */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="bg-primary/10 p-4 rounded-xl border border-primary/20">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Reward Wallet Balance</p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground truncate max-w-[200px] sm:max-w-none">
              {isLoading ? "..." : formatCurrency(balance)}
            </h1>
          </div>
        </div>

        <div className="relative z-10 w-full md:w-auto">
          <Dialog>
            <DialogTrigger 
              render={
                <Button size="lg" className="w-full md:w-auto font-semibold px-8 shadow-md" disabled={isLoading}>
                  <HandCoins className="mr-2 h-5 w-5" />
                  Withdraw Funds
                </Button>
              }
            />
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Withdraw Funds</DialogTitle>
                <DialogDescription>
                  Enter the amount you wish to withdraw to your registered bank account.
                </DialogDescription>
              </DialogHeader>
              <div className="pt-4">
                <WithdrawForm availableBalance={balance} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Transaction History Section */}
      <Card className="shadow-sm border">
        <div className="p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/10">
          <CardTitle className="text-lg">Transaction History</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={historyType} onValueChange={(val) => val && setHistoryType(val)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select type">
                  {{
                    daily_rewards: "Interest",
                    level_income: "Level Income",
                    withdrawals: "Withdrawals"
                  }[historyType]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily_rewards">Interest</SelectItem>
                <SelectItem value="level_income">Level Income</SelectItem>
                <SelectItem value="withdrawals">Withdrawals</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            {historyType === "daily_rewards" && (
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="pl-6">Date</TableHead>
                    <TableHead>Source Pool</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right pr-6">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyRewards.length > 0 ? (
                    dailyRewards.map((tx) => (
                      <TableRow key={tx.id} className="hover:bg-muted/10">
                        <TableCell className="pl-6 font-medium whitespace-nowrap">{new Date(tx.created_at || '').toLocaleString()}</TableCell>
                        <TableCell>{tx.source}</TableCell>
                        <TableCell>{renderStatusBadge(tx.type)}</TableCell>
                        <TableCell className="text-right pr-6 font-semibold text-emerald-500">
                          +{formatCurrency(tx.amount)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        {isLoading ? "Loading..." : "No interest history found."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}

            {historyType === "level_income" && (
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="pl-6">Date</TableHead>
                    <TableHead>From Member / Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right pr-6">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {levelIncome.length > 0 ? (
                    levelIncome.map((tx) => (
                      <TableRow key={tx.id} className="hover:bg-muted/10">
                        <TableCell className="pl-6 font-medium whitespace-nowrap">{new Date(tx.created_at || '').toLocaleString()}</TableCell>
                        <TableCell>{tx.description || tx.source}</TableCell>
                        <TableCell>{renderStatusBadge(tx.type)}</TableCell>
                        <TableCell className="text-right pr-6 font-semibold text-emerald-500">
                          +{formatCurrency(tx.amount)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        {isLoading ? "Loading..." : "No level income found."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}

            {historyType === "withdrawals" && (
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="pl-6">Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Amount</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">TDS</TableHead>
                    <TableHead className="text-right pr-6">Net Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.length > 0 ? (
                    withdrawals.map((tx) => (
                      <TableRow key={tx.id} className="hover:bg-muted/10">
                        <TableCell className="pl-6 font-medium whitespace-nowrap">{new Date(tx.created_at || '').toLocaleString()}</TableCell>
                        <TableCell>{renderStatusBadge(tx.status)}</TableCell>
                        <TableCell className="text-right text-muted-foreground hidden sm:table-cell">
                          {formatCurrency((tx.amount_requested as number) || tx.amount || 0)}
                        </TableCell>
                        <TableCell className="text-right text-destructive hidden sm:table-cell">
                          -{formatCurrency(tx.tds_amount || 0)}
                          <span className="text-xs opacity-70 ml-1">
                            {((tx as any).withdrawal_fee_pct ?? settings?.withdrawal_fee_pct) != null
                              ? `(${((tx as any).withdrawal_fee_pct ?? settings?.withdrawal_fee_pct)}%)`
                              : '(N/A)'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right pr-6 font-semibold text-foreground">
                          {formatCurrency(tx.net_amount || 0)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        {isLoading ? "Loading..." : "No withdrawal history found."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
