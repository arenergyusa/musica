"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { WithdrawForm } from "@/components/forms/WithdrawForm";

export default function WithdrawPage() {
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get("/wallet/balance")
      .then((res) => setBalance(res.data?.data?.balance || 0))
      .catch((error) => console.error("Failed to load wallet balance", error))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="max-w-xl mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
            <p className="text-xs text-slate-400">Loading wallet balance...</p>
          ) : (
            <WithdrawForm availableBalance={balance} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
