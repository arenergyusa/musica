"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import axios from "axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus,
  Loader2,
  CheckCircle2,
  Zap,
  TrendingUp,
  Layers,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function AdminManualInvestmentPage() {
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState<string>("100");
  const [isLoading, setIsLoading] = useState(false);
  const [rates, setRates] = useState<{ l1: number; l2: number; l3: number }>({ l1: 4, l2: 1, l3: 1 });
  const [lastSuccess, setLastSuccess] = useState<{
    id: string;
    email: string;
    amount: number;
    created_at: string;
  } | null>(null);

  // Load live invite-reward rates from platform settings so the commission
  // preview always matches what the backend actually credits (B7).
  useEffect(() => {
    api.get("/admin/settings")
      .then((res) => {
        if (res.data.data) {
          const s = res.data.data;
          setRates({
            l1: Number(s.invite_reward_l1_pct) || 0,
            l2: Number(s.invite_reward_l2_pct) || 0,
            l3: Number(s.invite_reward_l3_pct) || 0,
          });
        }
      })
      .catch(() => { /* keep defaults on settings failure */ });
  }, []);

  const numAmount = parseFloat(amount) || 0;

  // Real-time calculation using live platform rates
  const l1Reward = numAmount * (rates.l1 / 100);
  const l2Reward = numAmount * (rates.l2 / 100);
  const l3Reward = numAmount * (rates.l3 / 100);
  const totalReward = l1Reward + l2Reward + l3Reward;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter user email address");
      return;
    }
    if (numAmount < 100 || numAmount % 100 !== 0) {
      toast.error("Investment amount must be a multiple of $100 (e.g. 100, 200, 300, 400...)");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post("/admin/investments/manual", {
        email: email.trim(),
        amount: numAmount,
      });

      const invData = res.data?.data;
      toast.success("Investment Activated & Invite Rewards Distributed!", {
        description: `Successfully credited ${formatCurrency(numAmount)} to ${email}`,
      });

      setLastSuccess({
        id: invData?.id || "N/A",
        email: email.trim(),
        amount: numAmount,
        created_at: new Date().toISOString(),
      });

      // Clear form
      setEmail("");
      setAmount("100");
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to process manual investment");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl text-white shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold text-blue-400 uppercase tracking-widest mb-1">
            <UserPlus className="h-3.5 w-3.5" /> Manual Account Provisioning
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Direct Investment & Reward Distribution
          </h1>
        </div>
        <Badge
          variant="outline"
          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1 self-start sm:self-center shrink-0"
        >
          <Zap className="h-3.5 w-3.5 mr-1" /> Instant Settlement
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form Card */}
        <Card className="lg:col-span-2 rounded-2xl border-slate-200 dark:border-slate-800 shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Manual Investment Form
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Target User Email Address <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className="h-11 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-600 font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Investment Amount (USD) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400 text-sm font-bold">$</span>
                  <Input
                    type="number"
                    min={100}
                    step={100}
                    placeholder="Enter amount (e.g. 100, 200, 300)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={isLoading}
                    required
                    className="h-11 pl-8 rounded-xl text-sm font-extrabold bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-600"
                  />
                </div>
              </div>

              {/* Quick Amount Selector */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[100, 250, 500, 1000, 2500, 5000].map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(preset.toString())}
                    disabled={isLoading}
                    className={`h-8 rounded-lg text-xs font-bold ${
                      numAmount === preset
                        ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    ${preset}
                  </Button>
                ))}
              </div>

              {/* Commission Preview Card */}
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-blue-500" />
                    Upline Invite Income Distribution Breakdown
                  </span>
                  <Badge variant="outline" className="text-[10px] text-blue-600 bg-blue-50 dark:bg-blue-950/50">
                    Est. Total: {formatCurrency(totalReward)}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">Level 1 ({rates.l1}%)</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(l1Reward)}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">Level 2 ({rates.l2}%)</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(l2Reward)}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">Level 3 ({rates.l3}%)</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(l3Reward)}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !email.trim() || numAmount <= 0}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-lg transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Investment & Distributing Rewards...
                  </>
                ) : (
                  <>
                    Grant {formatCurrency(numAmount)} Investment & Distribute Rewards
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right Info & Last Action Card */}
        <div className="space-y-6">
          {/* Information Card */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-slate-900 dark:to-slate-950 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <Sparkles className="h-4 w-4 text-blue-600" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-3 text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Instant Activation:</strong> The investment is created with <strong>ACTIVE</strong> status without requiring USDT hash submission.
                </span>
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Account Status Upgrade:</strong> If the user was in REGISTERED state, their status automatically upgrades to <strong>ACTIVE</strong>.
                </span>
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Auto Commission Distribution:</strong> Up to 3 levels of active uplines automatically receive their invite rewards in their reward wallet immediately.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Last Processed Result */}
          {lastSuccess && (
            <Card className="rounded-2xl border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Last Executed Grant
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <div className="flex justify-between border-b border-emerald-200/60 dark:border-emerald-900/50 pb-1.5">
                  <span className="text-slate-500 dark:text-slate-400">User Email:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{lastSuccess.email}</span>
                </div>
                <div className="flex justify-between border-b border-emerald-200/60 dark:border-emerald-900/50 pb-1.5">
                  <span className="text-slate-500 dark:text-slate-400">Amount Granted:</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(lastSuccess.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Investment ID:</span>
                  <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300">
                    {lastSuccess.id.substring(0, 8)}...
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
