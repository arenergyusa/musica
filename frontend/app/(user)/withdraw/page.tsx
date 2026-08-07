"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { WithdrawForm } from "@/components/forms/WithdrawForm";

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

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Withdraw Funds"
        description="Enter an amount and receive the net USDT payout automatically."
      />

      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
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
  );
}
