"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Zap, Minus, Plus, Clock, FileCheck, Landmark } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { PDFReceipt } from "@/components/shared/PDFReceipt";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

const MIN_AMOUNT = 10000;
const MAX_AMOUNT = 1000000;
const STEP_AMOUNT = 10000;

const PRESET_AMOUNTS = [10000, 20000, 50000, 100000, 250000];

export default function InvestPage() {
  const { user, fetchUser } = useAuthStore();
  const isKycApproved = user?.kycStatus === "APPROVED";

  const [amount, setAmount] = useState<number>(MIN_AMOUNT);
  const [activeInvestments, setActiveInvestments] = useState<Investment[]>([]);
  const [dailyRatePct, setDailyRatePct] = useState<number>(0.3333);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<{
    id: string;
    amount: number;
    created_at: string;
    status: string;
    user_name?: string;
    user_email?: string;
    referral_code?: string;
  } | null>(null);

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
        console.error("Failed to load sponsorship data", error);
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
        title="Project Sponsorship"
        description="Sponsor Haryanvi music video projects in multiples of ₹10,000 and receive daily revenue share rewards."
      />

      {!isKycApproved && (
        <Alert variant="destructive" className="border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-300 rounded-xl">
          <AlertTitle className="text-amber-800 dark:text-amber-200 font-bold text-xs">KYC Verification Required</AlertTitle>
          <AlertDescription className="text-amber-700/90 dark:text-amber-300/90 text-xs">
            Complete your KYC verification in Profile settings to enable project sponsorship and payouts.
          </AlertDescription>
        </Alert>
      )}

      {/* Interactive Sponsorship Calculator Card */}
      <Card className="relative overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-sm">
        <div className="absolute top-0 right-0 bg-blue-600 py-1 px-3 text-[10px] font-bold text-white uppercase tracking-wider rounded-bl-lg flex items-center">
          <Zap className="h-3 w-3 mr-1" /> Project Sponsorship
        </div>

        <CardHeader className="pt-6 text-center pb-2">
          <CardTitle className="text-xl font-extrabold text-slate-900 dark:text-white">Select Sponsorship Contribution</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Choose your contribution amount (Multiples of ₹10,000).
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 mt-2">
          <div className="flex flex-col items-center justify-center space-y-6">

            {/* Amount Stepper */}
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/50 transition-all"
                onClick={handleDecrease}
                disabled={amount <= MIN_AMOUNT}
              >
                <Minus className="h-5 w-5" />
              </Button>
              <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums min-w-[220px] text-center">
                {formatCurrency(amount)}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/50 transition-all"
                onClick={handleIncrease}
                disabled={amount >= MAX_AMOUNT}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>

            {/* Preset Amount Chips */}
            <div className="flex flex-wrap justify-center gap-2">
              {PRESET_AMOUNTS.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant={amount === preset ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAmount(preset)}
                  className={`h-8 text-xs font-bold rounded-lg transition-all ${amount === preset
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-blue-600"
                    }`}
                >
                  {formatCurrency(preset)}
                </Button>
              ))}
            </div>

            {/* Range Slider */}
            <div className="w-full max-w-md space-y-2 px-4">
              <Slider
                value={[amount]}
                min={MIN_AMOUNT}
                max={MAX_AMOUNT}
                step={STEP_AMOUNT}
                onValueChange={(val) => setAmount(Array.isArray(val) ? val[0] : (typeof val === "number" ? val : MIN_AMOUNT))}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>{formatCurrency(MIN_AMOUNT)}</span>
                <span>{formatCurrency(MAX_AMOUNT)}</span>
              </div>
            </div>

            {/* Revenue Share Estimate Box */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-md bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 text-center">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Daily Revenue Share</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">+{formatCurrency(dailyReturn)}</p>
                <p className="text-[10px] text-slate-400">{(dailyRatePct).toFixed(4)}%/day</p>
              </div>
              <div className="border-l border-slate-200 dark:border-slate-700 pl-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Est. Monthly Payout</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">+{formatCurrency(monthlyReturn)}</p>
                <p className="text-[10px] text-slate-400">~10%/month</p>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="justify-center pb-6">
          {isKycApproved ? (
            <Dialog>
              <DialogTrigger className="w-full max-w-sm h-11 text-xs font-bold shadow-sm bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center justify-center rounded-lg cursor-pointer transition-all">
                Proceed to Sponsor {formatCurrency(amount)}
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-xl border-slate-200 dark:border-slate-800">
                <DialogHeader className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">Project Sponsorship Verification</DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Make your payment to the company account below and submit the transaction UTR number.
                  </DialogDescription>
                </DialogHeader>
                <div className="px-6 pb-6 pt-3 overflow-y-auto max-h-[70vh]">
                  <InvestForm amount={amount} />
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Button
              size="lg"
              className="w-full max-w-sm h-11 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg cursor-not-allowed"
              disabled
            >
              KYC Verification Required
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Active Sponsorships List */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">My Active Sponsorships</h2>
          <Badge variant="outline" className="text-xs font-semibold rounded-lg border-slate-200 dark:border-slate-800">
            {activeInvestments.length} {activeInvestments.length === 1 ? "Sponsorship" : "Sponsorships"}
          </Badge>
        </div>

        {isLoading ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : activeInvestments.length > 0 ? (
          <div className="grid gap-4">
            {activeInvestments.map((inv) => {
              const earned = inv.total_reward_earned || 0;
              const capLimit = inv.cap_limit || (inv.amount * 2);
              const progressPct = Math.min((earned / capLimit) * 100, 100);
              const isCapped = inv.status === "CAPPED" || earned >= capLimit;
              const isPending = inv.status === "PENDING";
              const dailyRoi = (inv.amount * (inv.daily_rate_pct || 0.3333)) / 100;

              return (
                <Card key={inv.id} className={`border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl transition-all shadow-sm ${isCapped ? "opacity-75 bg-slate-50 dark:bg-slate-900/50" : ""}`}>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl border ${isCapped ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 text-amber-600" : isPending ? "bg-slate-100 dark:bg-slate-800 border-slate-200 text-slate-500" : "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-600"}`}>
                          <Landmark className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-lg text-slate-900 dark:text-white">{formatCurrency(inv.amount)}</span>
                            <Badge variant={inv.working_cap_at_creation ? "default" : "secondary"} className="text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {inv.working_cap_at_creation ? "3x Working Cap" : "2x Non-Working"}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>Sponsored: {new Date(inv.created_at || '').toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+{formatCurrency(dailyRoi)}/day</span>
                          </p>
                        </div>
                      </div>

                      <div className="sm:text-right flex flex-col sm:items-end gap-1.5">
                        {isPending ? (
                          <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/50 text-amber-600 border-amber-200 text-xs font-semibold">
                            <Clock className="h-3 w-3 mr-1" /> Pending Approval
                          </Badge>
                        ) : isCapped ? (
                          <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200 text-xs font-semibold">
                            🔒 Closed (Cap Reached)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border-emerald-200 text-xs font-semibold">
                            🟢 Active &amp; Earning
                          </Badge>
                        )}

                        {!isPending && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 font-semibold"
                            onClick={() => setSelectedReceipt({
                              id: inv.id,
                              amount: inv.amount,
                              created_at: inv.created_at || '',
                              status: inv.status,
                              user_name: user?.name,
                              user_email: user?.email,
                              referral_code: user?.referralCode
                            })}
                          >
                            <FileCheck className="mr-1 h-3.5 w-3.5" /> Download Tax Receipt
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Cap Progress Bar */}
                    {!isPending && (
                      <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <span>Earned Toward Cap:</span>
                            <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(earned)}</span>
                          </span>
                          <span className="text-slate-500 dark:text-slate-400">
                            Cap Limit: <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(capLimit)}</span> ({progressPct.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress value={progressPct} className={`h-2 rounded-full ${isCapped ? "bg-amber-500/20" : ""}`} />
                        <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                          <span>ROI + Invite + Level rewards count toward cap</span>
                          <span>{capLimit - earned > 0 ? `Remaining: ${formatCurrency(capLimit - earned)}` : "Fully Earned"}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Zap}
            title="No Active Sponsorships"
            description="You haven't sponsored any music projects yet. Use the calculator above to select your contribution."
          />
        )}
      </div>

      {/* PDF Tax Receipt Modal */}
      <PDFReceipt
        subscription={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
}
