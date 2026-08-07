"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { WithdrawForm } from "@/components/forms/WithdrawForm";
import { Wallet, Percent, ShieldCheck, AlertTriangle, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function WithdrawPage() {
  const [balance, setBalance] = useState(0);
  const [minWithdrawal, setMinWithdrawal] = useState(10);
  const [feePct, setFeePct] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/wallet/balance"), api.get("/settings")])
      .then(([balRes, setRes]) => {
        setBalance(balRes.data?.data?.balance || 0);
        if (setRes.data?.data?.withdrawal_min_amount) {
          setMinWithdrawal(setRes.data.data.withdrawal_min_amount);
        }
        if (typeof setRes.data?.data?.withdrawal_fee_pct === "number") {
          setFeePct(setRes.data.data.withdrawal_fee_pct);
        }
      })
      .catch((error) => console.error("Failed to load withdraw data", error))
      .finally(() => setIsLoading(false));
  }, []);

  const feeEstimate = balance * (feePct / 100);
  const netEstimate = Math.max(0, balance - feeEstimate);

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Withdraw Funds"
        description="Enter an amount and receive the net USDT payout automatically."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Main withdrawal form — full width on mobile, two-thirds on desktop */}
        <div className="lg:col-span-2">
          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 h-full">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold">USDT BEP-20 Withdrawal</CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-20 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
                  <div className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
                  <div className="h-14 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
                </div>
              ) : (
                <WithdrawForm
                  availableBalance={balance}
                  minWithdrawal={minWithdrawal}
                  feePct={feePct}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary sidebar — stacks below the form on mobile */}
        <div className="space-y-5">
          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Available Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-3">
              <p className="text-2xl sm:text-3xl font-black font-mono text-blue-600 dark:text-blue-400">
                {formatCurrency(isLoading ? 0 : balance)}
              </p>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1">
                    <Percent className="h-3 w-3" /> Fee
                  </p>
                  <p className="mt-1 text-sm font-extrabold text-rose-600 dark:text-rose-400">{feePct}%</p>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1">
                    <Clock className="h-3 w-3" /> Min
                  </p>
                  <p className="mt-1 text-sm font-extrabold text-slate-700 dark:text-slate-200">{formatCurrency(minWithdrawal)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Estimate
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>Total Balance</span>
                <span className="font-bold font-mono">{formatCurrency(isLoading ? 0 : balance)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>Fee ({feePct}%)</span>
                <span className="font-bold font-mono text-rose-600 dark:text-rose-400">
                  -{formatCurrency(isLoading ? 0 : feeEstimate)}
                </span>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200">You receive</span>
                <span className="font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(isLoading ? 0 : netEstimate)}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/20 p-4 flex gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
              Withdrawals are processed automatically to your USDT (BEP-20) address.
              Payouts normally settle within minutes once the master wallet has
              network gas funded.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
