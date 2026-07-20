/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Zap, Minus, Plus, TrendingUp, Info } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
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
const MAX_AMOUNT = 1000000; // 10 Lakhs max per single transaction (can adjust)
const STEP_AMOUNT = 10000;

export default function InvestPage() {
  const { user, fetchUser } = useAuthStore();
  const isKycApproved = user?.kycStatus === "APPROVED";
  
  const [amount, setAmount] = useState<number>(MIN_AMOUNT);
  const [activeInvestments, setActiveInvestments] = useState<Investment[]>([]);
  const [dailyRatePct, setDailyRatePct] = useState<number>(0.3333);
  const [nonWorkingCap, setNonWorkingCap] = useState<number>(2);
  const [workingCap, setWorkingCap] = useState<number>(3);
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
          setNonWorkingCap(plansRes.data.data[0].non_working_cap_multiplier || 2);
          setWorkingCap(plansRes.data.data[0].working_cap_multiplier || 3);
        }
      } catch (error) {
        console.error("Failed to load investment data", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

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
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader 
        title="Musica Premium Plan" 
        description="Subscribe in multiples of ₹10,000 to a premium plan and receive daily reward credits."
        action={
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-muted/50 px-4 py-2 rounded-full border">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Governed by Platform Terms & Conditions</span>
          </div>
        }
      />

      {!isKycApproved && (
        <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
          <AlertTitle className="text-red-600 dark:text-red-400 font-bold">KYC Verification Required</AlertTitle>
          <AlertDescription className="text-red-600/90 dark:text-red-400/90">
            You must complete your KYC verification before you can participate in any plans. 
            Please visit the KYC portal to submit your documents.
          </AlertDescription>
        </Alert>
      )}

      {/* Interactive Calculator Card */}
      <Card className="relative overflow-hidden border-2 bg-gradient-to-b from-primary/5 to-transparent border-primary/20 shadow-lg">
        <div className="absolute top-0 right-0 bg-primary py-1 px-4 text-xs font-bold text-primary-foreground uppercase tracking-wider rounded-bl-lg flex items-center">
          <Zap className="h-3 w-3 mr-1" fill="currentColor" /> Dynamic Plan
        </div>
        <CardHeader className="pt-8 text-center pb-2">
          <CardTitle className="text-2xl font-bold">Choose Plan Amount</CardTitle>
          <CardDescription>
            Adjust the slider or use buttons to select your desired subscription.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 mt-4">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="flex items-center justify-center space-x-4">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-12 w-12 rounded-full border-primary/30 hover:bg-primary/10 hover:text-primary"
                onClick={handleDecrease}
                disabled={amount <= MIN_AMOUNT}
              >
                <Minus className="h-5 w-5" />
              </Button>
              <div className="text-5xl font-extrabold tracking-tighter text-primary tabular-nums min-w-[200px] text-center">
                {formatCurrency(amount)}
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-12 w-12 rounded-full border-primary/30 hover:bg-primary/10 hover:text-primary"
                onClick={handleIncrease}
                disabled={amount >= MAX_AMOUNT}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="w-full max-w-lg px-4">
              <Slider
                value={[amount]}
                min={MIN_AMOUNT}
                max={MAX_AMOUNT}
                step={STEP_AMOUNT}
                onValueChange={(vals) => setAmount(Array.isArray(vals) ? vals[0] : vals as number)}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2 font-medium">
                <span>{formatCurrency(MIN_AMOUNT)}</span>
                <span>{formatCurrency(MAX_AMOUNT)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="bg-background rounded-xl p-4 border flex items-center justify-between shadow-sm">
              <div className="flex items-center text-muted-foreground">
                <TrendingUp className="h-5 w-5 mr-2 text-emerald-500" />
                <span className="font-medium text-sm">Daily Reward Share</span>
              </div>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(dailyReturn)} <span className="text-xs text-muted-foreground font-normal">/ day</span>
              </span>
            </div>
            <div className="bg-background rounded-xl p-4 border flex items-center justify-between shadow-sm">
              <div className="flex items-center text-muted-foreground">
                <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
                <span className="font-medium text-sm">Monthly Est.</span>
              </div>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(monthlyReturn)} <span className="text-xs text-muted-foreground font-normal">/ mo</span>
              </span>
            </div>
          </div>

          <div className="flex items-start justify-center text-xs text-muted-foreground max-w-xl mx-auto bg-muted/30 p-3 rounded-md">
            <Info className="h-4 w-4 mr-2 shrink-0 mt-0.5" />
            <p>
              Your subscription receives a daily reward credit of <strong>{dailyRatePct}%</strong> of the subscribed amount.
              Total credits are capped at <strong>{nonWorkingCap}x</strong> (Non-Working) or <strong>{workingCap}x</strong> (Working) of your subscription.
            </p>
          </div>
        </CardContent>
        <CardFooter className="justify-center pb-8">
          {isKycApproved ? (
            <Dialog>
              <DialogTrigger 
                render={
                  <Button 
                    size="lg" 
                    className="w-full max-w-sm text-lg h-14 font-bold shadow-xl shadow-primary/20"
                  >
                    Proceed to Subscribe {formatCurrency(amount)}
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 bg-muted/30 border-b">
                  <DialogTitle className="text-xl">Complete Your Subscription</DialogTitle>
                  <DialogDescription>
                    Make the payment for your plan participation and submit the UTR/reference number below.
                  </DialogDescription>
                </DialogHeader>
                <div className="px-6 pb-6 pt-2 overflow-y-auto max-h-[70vh]">
                  <InvestForm amount={amount} />
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Button 
              size="lg" 
              variant="secondary" 
              className="w-full max-w-sm text-lg h-14 font-bold"
              disabled
            >
              KYC Required
            </Button>
          )}
        </CardFooter>
      </Card>

      <div className="mt-12 space-y-6">
        <h2 className="text-xl font-bold tracking-tight">Active Subscriptions</h2>
        
        {isLoading ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : activeInvestments.length > 0 ? (
          <div className="grid gap-4">
            {activeInvestments.map((inv) => (
              <Card key={inv.id} className="border bg-card">
                <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{formatCurrency(inv.amount)}</p>
                      <p className="text-sm text-muted-foreground">
                        {inv.status === "PENDING" ? "Pending Approval" : "Active Plan Subscription"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={inv.status === "PENDING" ? "outline" : "default"} className="mb-1">
                      {inv.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {new Date(inv.created_at || '').toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState 
            icon={Zap}
            title="No Active Subscriptions"
            description="You haven't subscribed to any plans yet. Use the calculator above to estimate your rewards."
          />
        )}
      </div>
    </div>
  );
}
