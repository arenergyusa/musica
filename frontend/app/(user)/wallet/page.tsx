"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wallet, ArrowUpRight, Clock, CheckCircle2, XCircle, HandCoins,
  TrendingUp, FileSpreadsheet
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Transaction, Withdrawal } from "@/lib/types";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import Link from "next/link";

const renderStatusBadge = (status: string) => {
  switch (status) {
    case "CREDITED":
    case "CREDIT":
    case "SUCCESS":
    case "PROCESSED":
    case "APPROVED":
      return (
        <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 text-xs font-semibold">
          <CheckCircle2 className="mr-1 h-3 w-3" /> {status}
        </Badge>
      );
    case "PENDING":
      return (
        <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/50 text-amber-600 border-amber-200 text-xs font-semibold">
          <Clock className="mr-1 h-3 w-3" /> {status}
        </Badge>
      );
    case "REJECTED":
    case "DEBIT":
      return (
        <Badge variant="outline" className="bg-rose-50 dark:bg-rose-950/50 text-rose-600 border-rose-200 text-xs font-semibold">
          <XCircle className="mr-1 h-3 w-3" /> {status}
        </Badge>
      );
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
};

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [totalCredited, setTotalCredited] = useState(0);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [historyType, setHistoryType] = useState("daily_roi");

  useEffect(() => {
    async function fetchData() {
      try {
        const [balRes, txRes, wdRes] = await Promise.all([
          api.get("/wallet/balance"),
          api.get("/wallet/transactions?limit=500"),
          api.get("/withdrawal/history")
        ]);

        const balData = balRes.data.data || {};
        setBalance(balData.balance || 0);
        setTotalCredited(balData.total_credited || 0);
        setTotalWithdrawn(balData.total_withdrawn || 0);

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

  const dailyRewards = transactions.filter(t => t.source === "DAILY_ROI" || t.source === "DAILY_REWARD");
  const levelIncome = transactions.filter(t => t.source === "LEVEL_INCOME");
  const inviteIncome = transactions.filter(t => t.source === "INVITE" || t.source === "REFERRAL");
  const salaryIncome = transactions.filter(t => t.source === "SALARY_INCOME" || t.source === "SALARY");
  const statementTransactions = historyType === "daily_roi" ? dailyRewards
    : historyType === "level_income" ? levelIncome
    : historyType === "invite_income" ? inviteIncome
    : salaryIncome;
  const statementLabel = historyType === "daily_roi" ? "Daily ROI"
    : historyType === "level_income" ? "Level Income"
    : historyType === "invite_income" ? "Invite Income"
    : "Salary";

  const handleExportCSV = () => {
    let csvContent = "";
    let fileName = "";

    if (historyType === "withdrawals") {
      csvContent = "Date,Status,Requested Amount,TDS Amount,Net Amount\n";
      withdrawals.forEach((w) => {
        const date = new Date(w.created_at || '').toLocaleDateString();
        csvContent += `"${date}","${w.status}",${w.amount_requested || w.amount || 0},${w.tds_amount || 0},${w.net_amount || 0}\n`;
      });
      fileName = `musica_withdrawals_${new Date().toISOString().slice(0, 10)}.csv`;
    } else {
      const txList = statementTransactions;
      csvContent = "Date,Type,Source,Description,Amount\n";
      txList.forEach((t) => {
        const date = new Date(t.created_at || '').toLocaleDateString();
        const desc = (t.description || t.source || "").replace(/"/g, '""');
        csvContent += `"${date}","${t.type}","${t.source}","${desc}",${t.amount}\n`;
      });
      fileName = `musica_transactions_${historyType}_${new Date().toISOString().slice(0, 10)}.csv`;
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    toast.success("CSV Statement downloaded successfully!");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Page Header & Balance Card */}
      <PageHeader
        title="Wallet"
        description="Manage your accumulated ROI rewards, withdrawal requests, and transaction statements."
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="bg-blue-50 dark:bg-blue-950/60 p-3.5 rounded-xl text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/60">
            <Wallet className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Wallet Balance</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-none">
              {isLoading ? "..." : formatCurrency(balance)}
            </h1>
          </div>
        </div>

        <div className="relative z-10 w-full md:w-auto flex items-center gap-3">
          <Link href="/withdraw" className="w-full md:w-auto font-bold px-6 shadow-sm bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center justify-center rounded-lg h-10 text-xs border border-blue-600 transition-all">
              <HandCoins className="mr-2 h-4 w-4" />
              Withdraw Funds
          </Link>
        </div>
      </div>

      {/* Wallet Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Lifetime Credited</p>
              <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalCredited)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 rounded-lg">
              <ArrowUpRight className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Withdrawn</p>
              <p className="text-lg font-extrabold text-slate-900 dark:text-white">{formatCurrency(totalWithdrawn)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 rounded-lg">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pending Withdrawals</p>
              <p className="text-lg font-extrabold text-slate-900 dark:text-white">
                {withdrawals.filter(w => w.status === "PENDING").length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Transaction History Section */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Statement &amp; Transaction History</CardTitle>
            <CardDescription className="text-xs text-slate-500">Filter and export your revenue ledger records</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Select value={historyType} onValueChange={(val) => val && setHistoryType(val)}>
              <SelectTrigger className="w-[170px] text-xs h-9 rounded-lg border-slate-200 dark:border-slate-800">
                <SelectValue placeholder="Select type">
                  {{
                    daily_roi: "Daily ROI",
                    level_income: "Level Income",
                    invite_income: "Invite Income",
                    salary: "Salary",
                    withdrawals: "Withdrawals"
                  }[historyType]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
              <SelectItem value="daily_roi">Daily ROI</SelectItem>
              <SelectItem value="level_income">Level Income</SelectItem>
              <SelectItem value="invite_income">Invite Income</SelectItem>
              <SelectItem value="salary">Salary</SelectItem>
                <SelectItem value="withdrawals">Withdrawals</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" className="h-9 text-xs border-slate-200 dark:border-slate-800 font-bold rounded-lg" onClick={handleExportCSV}>
              <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
              Export CSV
            </Button>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            {historyType !== "withdrawals" && (
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                  <TableRow>
                    <TableHead className="pl-5 text-xs font-bold text-slate-700 dark:text-slate-300">Date</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Source</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Type</TableHead>
                    <TableHead className="text-right pr-5 text-xs font-bold text-slate-700 dark:text-slate-300">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statementTransactions.length > 0 ? (
                    statementTransactions.map((tx) => (
                      <TableRow key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <TableCell className="pl-5 font-medium whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                          {new Date(tx.created_at || '').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-slate-900 dark:text-white">{tx.description || statementLabel}</TableCell>
                        <TableCell>{renderStatusBadge(tx.type)}</TableCell>
                        <TableCell className="text-right pr-5 font-extrabold text-xs text-emerald-600 dark:text-emerald-400">
                          +{formatCurrency(tx.amount)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-xs text-slate-400">
                        {isLoading ? "Loading..." : `No ${statementLabel.toLowerCase()} history recorded.`}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}

            {historyType === "withdrawals" && (
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                  <TableRow>
                    <TableHead className="pl-5 text-xs font-bold text-slate-700 dark:text-slate-300">Date</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Status</TableHead>
                    <TableHead className="text-right text-xs font-bold text-slate-700 dark:text-slate-300">Requested</TableHead>
                    <TableHead className="text-right text-xs font-bold text-slate-700 dark:text-slate-300">TDS (10%)</TableHead>
                    <TableHead className="text-right pr-5 text-xs font-bold text-slate-900 dark:text-white">Net Received</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.length > 0 ? (
                    withdrawals.map((tx) => (
                      <TableRow key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <TableCell className="pl-5 font-medium whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                          {new Date(tx.created_at || '').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </TableCell>
                        <TableCell>{renderStatusBadge(tx.status)}</TableCell>
                        <TableCell className="text-right text-slate-500 text-xs font-medium">
                          {formatCurrency((tx.amount_requested as number) || tx.amount || 0)}
                        </TableCell>
                        <TableCell className="text-right text-red-500 text-xs font-medium">
                          -{formatCurrency(tx.tds_amount || 0)}
                        </TableCell>
                        <TableCell className="text-right pr-5 font-extrabold text-xs text-slate-900 dark:text-white">
                          {formatCurrency(tx.net_amount || 0)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-xs text-slate-400">
                        {isLoading ? "Loading..." : "No withdrawal history recorded."}
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
