"use client";

import { useState } from "react";
import { Wallet, ArrowRight, Eye, EyeOff, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

interface RewardWalletProps {
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
  salaryIncome?: number;
  nextWithdrawalDate?: Date;
}

export function RewardWalletCard({
  balance,
  totalEarned,
  totalWithdrawn,
  salaryIncome = 0,
  nextWithdrawalDate = new Date(new Date().setHours(23, 59, 59, 999))
}: RewardWalletProps) {
  const [showBalance, setShowBalance] = useState(true);

  return (
    <Card className="overflow-hidden bg-white dark:bg-slate-900 text-foreground border border-slate-200/80 dark:border-slate-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-white to-sky-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/20 pointer-events-none" />

      <CardContent className="p-6 sm:p-7 relative z-10">
        <div className="flex justify-between items-start gap-4 mb-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center text-blue-600 dark:text-blue-400 font-semibold mb-2 tracking-wide text-xs uppercase">
              <Wallet className="h-4 w-4 mr-2 shrink-0" />
              <span>Wallet</span>
            </div>

            <div className="flex items-center flex-wrap sm:flex-nowrap gap-3">
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight flex items-center whitespace-nowrap text-slate-900 dark:text-white font-mono">
                <DollarSign className="h-7 w-7 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>{showBalance ? balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "••••••"}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg shrink-0 h-8 w-8"
                onClick={() => setShowBalance(!showBalance)}
                aria-label={showBalance ? "Hide balance" : "Show balance"}
              >
                {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Link href="/withdraw" passHref className="shrink-0">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-5 py-2.5 text-sm shadow-sm hover:shadow-md transition-all border border-blue-600"
            >
              Withdraw <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <Separator className="bg-slate-200 dark:bg-slate-800 mb-5" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50/80 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-100 dark:border-slate-800">
            <p className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider mb-1">Total Earned</p>
            <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(totalEarned)}</p>
          </div>
          <div className="bg-slate-50/80 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-100 dark:border-slate-800">
            <p className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider mb-1">Total Withdrawn</p>
            <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-mono">{formatCurrency(totalWithdrawn)}</p>
          </div>
          <div className="bg-slate-50/80 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-100 dark:border-slate-800">
            <p className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider mb-1">Salary Income</p>
            <p className="text-base sm:text-lg font-bold text-purple-600 dark:text-purple-400 font-mono">{formatCurrency(salaryIncome)}</p>
          </div>
          <div className="bg-slate-50/80 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-100 dark:border-slate-800">
            <p className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider mb-1">Next Settlement</p>
            <p className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400 font-mono">
              {nextWithdrawalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
