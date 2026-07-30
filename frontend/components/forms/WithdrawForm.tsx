"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, ArrowRightCircle, Wallet, AlertTriangle, ExternalLink, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { withdrawSchema, type WithdrawInput } from "@/lib/validators";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store/useAuthStore";

interface WithdrawFormProps {
  availableBalance: number;
  onSuccess?: () => void;
}

export function WithdrawForm({ availableBalance, onSuccess }: WithdrawFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [minWithdrawal, setMinWithdrawal] = useState<number>(10);
  const { user, fetchUser } = useAuthStore();

  useEffect(() => {
    fetchUser();
    api.get("/settings")
      .then((res) => {
        if (res.data?.data?.withdrawal_min_amount) {
          setMinWithdrawal(res.data.data.withdrawal_min_amount);
        }
      })
      .catch((err) => console.error(err));
  }, [fetchUser]);

  const form = useForm<WithdrawInput>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: {
      amount: undefined,
    },
  });

  const usdtAddress = user?.usdtAddress || (user as any)?.usdt_address;
  const hasUsdtAddress = Boolean(usdtAddress && usdtAddress.trim() !== "");

  const handleMaxAmount = () => {
    if (availableBalance > 0) {
      form.setValue("amount", Math.floor(availableBalance), { shouldValidate: true });
    }
  };

  async function onSubmit(data: WithdrawInput) {
    if (!hasUsdtAddress) {
      toast.error("Please configure your USDT (BEP-20) address in Profile settings first.");
      return;
    }

    if (data.amount > availableBalance) {
      form.setError("amount", {
        type: "manual",
        message: "Insufficient balance for this withdrawal.",
      });
      return;
    }

    if (data.amount < minWithdrawal) {
      form.setError("amount", {
        type: "manual",
        message: `Minimum withdrawal amount is ${formatCurrency(minWithdrawal)}`,
      });
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/withdrawal/request", {
        amount: data.amount,
      });

      toast.success("Withdrawal processed!", {
        description: `${formatCurrency(data.amount)} has been sent to your USDT (BEP-20) address automatically.`,
      });

      form.reset();
      if (onSuccess) onSuccess();
      if (fetchUser) await fetchUser();
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to submit withdrawal request.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        
        {/* USDT Address Card / Warning */}
        {hasUsdtAddress ? (
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2 shadow-sm border-l-4 border-l-blue-600">
            <div className="flex items-center justify-between">
              <h4 className="font-bold flex items-center text-xs text-slate-900 dark:text-white">
                <Wallet className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                Settlement USDT (BEP-20) Address
              </h4>
              <Link href="/profile" className="text-[11px] font-bold text-blue-600 hover:underline flex items-center">
                Edit <ExternalLink className="h-3 w-3 ml-1" />
              </Link>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <p className="font-bold text-slate-900 dark:text-white">{user?.name}</p>
              <p className="mt-0.5">BEP-20 Address: <span className="font-mono font-bold text-slate-900 dark:text-white">{usdtAddress}</span></p>
            </div>
          </div>
        ) : (
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-900 rounded-xl">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-xs font-bold text-amber-800 dark:text-amber-300">USDT Address Missing</AlertTitle>
            <AlertDescription className="text-xs text-amber-700 dark:text-amber-400/90 mt-1 space-y-2">
              <p>You have not configured your USDT (BEP-20) address yet.</p>
              <Link href="/profile" className="inline-flex items-center text-xs font-bold text-blue-600 hover:underline mt-1">
                Go to Profile Settings &amp; Add USDT Address <ExternalLink className="h-3.5 w-3.5 ml-1" />
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Amount Input */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold text-slate-800 dark:text-slate-200">Withdrawal Amount ($)</FormLabel>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400 text-xs font-bold">$</span>
                <FormControl>
                  <Input 
                    type="number"
                    placeholder="10" 
                    className="pl-7 pr-16 text-xs h-10 rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-600"
                    disabled={isLoading || !hasUsdtAddress}
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                  />
                </FormControl>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="absolute right-1 h-7 text-xs font-bold text-blue-600 hover:text-blue-700"
                  onClick={handleMaxAmount}
                  disabled={isLoading || availableBalance <= 0 || !hasUsdtAddress}
                >
                  MAX
                </Button>
              </div>
              <FormDescription className="text-[11px] text-slate-400">
                Minimum withdrawal is {formatCurrency(minWithdrawal)}. Payouts are executed automatically on BSC network.
              </FormDescription>
              <FormMessage className="text-[11px]" />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isLoading || !hasUsdtAddress}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold h-11 text-xs rounded-xl shadow-md transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing Auto Payout...
            </>
          ) : (
            <>
              Request Automated Payout <ArrowRightCircle className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
