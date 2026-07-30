"use client";

import { useState, useEffect } from "react";
import { Zap, Minus, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InvestForm } from "@/components/forms/InvestForm";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Investment } from "@/lib/types";

const MIN_AMOUNT = 100;
const MAX_AMOUNT = 100000;
const STEP_AMOUNT = 100;

const PRESET_AMOUNTS = [100, 500, 1000, 2500, 5000];

export default function InvestPage() {
  const { fetchUser } = useAuthStore();

  const [amount, setAmount] = useState<number>(MIN_AMOUNT);
  const [activeInvestments, setActiveInvestments] = useState<Investment[]>([]);
  const [dailyRatePct, setDailyRatePct] = useState<number>(0.3333);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        await fetchUser();
        const [myInvsRes, plansRes] = await Promise.all([
          api.get("/investment/my"),
          api.get("/investment/plans")
        ]);
        setActiveInvestments(myInvsRes.data.data || []);

        if (plansRes.data.data && plansRes.data.data.length > 0) {
          setDailyRatePct(plansRes.data.data[0].daily_rate_pct || 0.3333);
        }
      } catch (error) {
        console.error("Failed to load investment data", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [fetchUser]);

  const handleDecrease = () => {
    if (amount > MIN_AMOUNT) {
      setAmount(amount - STEP_AMOUNT);
    }
  };

  const handleIncrease = () => {
    if (amount < MAX_AMOUNT) {
      setAmount(amount + STEP_AMOUNT);
    }
  };

  const dailyReturn = (amount * dailyRatePct) / 100;
  const monthlyReturn = dailyReturn * 30;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Invest"
        description="Choose your investment amount in multiples of $100 USD to earn daily ROI rewards."
      />

      {/* Interactive Calculator Card */}
      <Card className="border border-slate-200/80 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden bg-white dark:bg-slate-900">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <Zap className="h-3.5 w-3.5" /> Direct Investment
          </div>
          <CardTitle className="text-xl font-extrabold text-slate-900 dark:text-white">Select Investment Contribution</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Slide or use presets to choose your investment. Returns earn up to 2x (Standard) or 3x (Active).
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Amount Display & Counter Controls */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-800/80">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Contribution Amount</span>
            <div className="flex items-center justify-center gap-4 w-full max-w-md">
              <Button
                variant="outline"
                size="icon"
                onClick={handleDecrease}
                disabled={amount <= MIN_AMOUNT}
                className="h-10 w-10 rounded-xl shrink-0"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
                {formatCurrency(amount)}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleIncrease}
                disabled={amount >= MAX_AMOUNT}
                className="h-10 w-10 rounded-xl shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Slider */}
          <div className="space-y-2 px-2">
            <Slider
              value={[amount]}
              min={MIN_AMOUNT}
              max={MAX_AMOUNT}
              step={STEP_AMOUNT}
              onValueChange={(vals) => {
                if (Array.isArray(vals)) {
                  setAmount(vals[0]);
                } else if (typeof vals === 'number') {
                  setAmount(vals);
                }
              }}
              className="w-full cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-medium font-mono">
              <span>{formatCurrency(MIN_AMOUNT)}</span>
              <span>{formatCurrency(MAX_AMOUNT / 2)}</span>
              <span>{formatCurrency(MAX_AMOUNT)}</span>
            </div>
          </div>

          {/* Preset Pill Buttons */}
          <div className="flex flex-wrap gap-2 justify-center pt-2">
            {PRESET_AMOUNTS.map((preset) => (
              <Button
                key={preset}
                variant={amount === preset ? "default" : "outline"}
                size="sm"
                onClick={() => setAmount(preset)}
                className={`rounded-lg font-mono text-xs ${
                  amount === preset
                    ? "bg-blue-600 text-white font-bold"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                {formatCurrency(preset)}
              </Button>
            ))}
          </div>

          {/* Estimated Returns Metric Box */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50">
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Estimated Daily ROI</p>
              <p className="text-lg font-black text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                {formatCurrency(dailyReturn)} <span className="text-xs font-normal text-slate-500">/day</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Estimated Monthly ROI</p>
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                {formatCurrency(monthlyReturn)} <span className="text-xs font-normal text-slate-500">/mo</span>
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-2 pb-6 border-t border-slate-100 dark:border-slate-800/80">
          <Dialog>
            <DialogTrigger className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold h-12 text-sm rounded-xl shadow-md flex items-center justify-center">
              Proceed to Invest {formatCurrency(amount)}
            </DialogTrigger>

            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">USDT BEP-20 Payment</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Transfer USDT (BEP-20) to complete your investment contribution.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <InvestForm amount={amount} />
              </div>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>

      {/* Active Investments Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">My Active Investments</h2>
          <Badge variant="outline" className="text-xs font-semibold">
            {activeInvestments.length} {activeInvestments.length === 1 ? "Investment" : "Investments"}
          </Badge>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        ) : activeInvestments.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {activeInvestments.map((inv) => {
              const capLimit = (inv as any).cap_limit || (inv as any).capLimit || 0;
              const totalEarned = (inv as any).total_reward_earned || (inv as any).totalEarned || 0;
              const capProgress = capLimit > 0 ? Math.min(100, Math.round((totalEarned / capLimit) * 100)) : 0;
              const statusColor = inv.status === "ACTIVE" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200";

              return (
                <Card key={inv.id} className="border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-base font-black text-slate-900 dark:text-white font-mono">
                      {formatCurrency(inv.amount)}
                    </CardTitle>
                    <Badge variant="outline" className={`text-[10px] font-bold ${statusColor}`}>
                      {inv.status}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-2 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Total Earned:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(totalEarned)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Cap Limit:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{formatCurrency(capLimit)}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-medium text-slate-400">
                        <span>Cap Progress</span>
                        <span>{capProgress}%</span>
                      </div>
                      <Progress value={capProgress} className="h-1.5" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Zap}
            title="No Active Investments"
            description="You don't have any active investments yet. Use the contribution tool above to get started."
          />
        )}
      </div>
    </div>
  );
}
