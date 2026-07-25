"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, ArrowRightCircle, Building, Wallet, Lock, AlertTriangle, ExternalLink } from "lucide-react";
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
  const [pinStep, setPinStep] = useState(false);
  const [securityPin, setSecurityPin] = useState("");
  const { user, fetchUser } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const form = useForm<WithdrawInput>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: {
      amount: undefined,
    },
  });

  const bankAccount = user?.bank_account || (user as any)?.bankAccount;
  const ifsc = user?.ifsc;
  const hasBankDetails = Boolean(bankAccount && bankAccount.trim() !== "");

  const handlePreSubmit = (data: WithdrawInput) => {
    if (!hasBankDetails) {
      toast.error("Please configure your settlement bank account in Profile settings first.");
      return;
    }

    if (data.amount > availableBalance) {
      form.setError("amount", {
        type: "manual",
        message: "Insufficient balance for this withdrawal.",
      });
      return;
    }
    setPinStep(true);
  };

  async function handleFinalSubmit() {
    if (!/^\d{6}$/.test(securityPin)) {
      toast.error("Please enter a valid 6-digit Security PIN.");
      return;
    }

    const amount = form.getValues("amount");
    setIsLoading(true);
    try {
      await api.post("/withdrawal/request", {
        amount: amount,
        security_pin: securityPin,
      });
      
      toast.success("Withdrawal request submitted!", {
        description: `${formatCurrency(amount)} will be credited to your bank account on the next scheduled payout date.`,
      });
      
      form.reset();
      setSecurityPin("");
      setPinStep(false);
      if (onSuccess) onSuccess();
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && typeof error.response?.data?.message === 'string') {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to submit withdrawal request.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  const handleMaxAmount = () => {
    form.setValue("amount", Math.floor(availableBalance), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  if (pinStep) {
    return (
      <div className="space-y-5 animate-in fade-in duration-300">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-200 dark:border-blue-900 shadow-sm">
            <Lock className="h-6 w-6" />
          </div>
          <h4 className="font-extrabold text-lg text-slate-900 dark:text-white">Enter Security PIN</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Confirm withdrawal payout of <strong>{formatCurrency(form.getValues("amount"))}</strong> to account ending in <span className="font-mono text-slate-900 dark:text-white">{bankAccount ? bankAccount.slice(-4) : ""}</span>.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block text-center">
            6-Digit Security PIN
          </label>
          <Input
            type="password"
            inputMode="numeric"
            maxLength={6}
            placeholder="••••••"
            className="text-center text-2xl font-mono tracking-widest h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg focus-visible:ring-2 focus-visible:ring-blue-600"
            value={securityPin}
            onChange={(e) => setSecurityPin(e.target.value)}
            disabled={isLoading}
            autoFocus
          />
          <p className="text-[10px] text-center text-slate-400">
            Encrypted verification to prevent unauthorized payouts
          </p>
        </div>

        <div className="flex gap-3">
          <Button 
            type="button" 
            variant="outline" 
            className="w-1/2 text-xs font-bold rounded-lg h-10 border-slate-200 dark:border-slate-800" 
            onClick={() => setPinStep(false)}
            disabled={isLoading}
          >
            Back
          </Button>
          <Button 
            type="button" 
            className="w-1/2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-10 shadow-sm transition-all" 
            onClick={handleFinalSubmit}
            disabled={isLoading || !/^\d{6}$/.test(securityPin)}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Payout"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handlePreSubmit)} className="space-y-5">
        
        {/* Balance Display */}
        <div className="bg-blue-50/60 dark:bg-blue-950/40 p-4 rounded-xl border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-between shadow-sm">
          <div className="flex items-center text-slate-700 dark:text-slate-300">
            <Wallet className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Available Balance</span>
          </div>
          <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
            {formatCurrency(availableBalance)}
          </span>
        </div>

        {/* Bank Details Card / Warning */}
        {hasBankDetails ? (
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2 shadow-sm border-l-4 border-l-blue-600">
            <div className="flex items-center justify-between">
              <h4 className="font-bold flex items-center text-xs text-slate-900 dark:text-white">
                <Building className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                Settlement Bank Account
              </h4>
              <Link href="/profile" className="text-[11px] font-bold text-blue-600 hover:underline flex items-center">
                Edit <ExternalLink className="h-3 w-3 ml-1" />
              </Link>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <p className="font-bold text-slate-900 dark:text-white">{user?.name}</p>
              <p className="mt-0.5">Account Number: <span className="font-mono font-bold text-slate-900 dark:text-white">{bankAccount}</span></p>
              <p className="mt-0.5">IFSC Code: <span className="font-mono font-bold text-slate-900 dark:text-white">{ifsc || "N/A"}</span></p>
            </div>
          </div>
        ) : (
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-900 rounded-xl">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-xs font-bold text-amber-800 dark:text-amber-300">Bank Account Details Missing</AlertTitle>
            <AlertDescription className="text-xs text-amber-700 dark:text-amber-400/90 mt-1 space-y-2">
              <p>You have not configured your settlement bank account yet.</p>
              <Link href="/profile" className="inline-flex items-center text-xs font-bold text-blue-600 hover:underline mt-1">
                Go to Profile Settings &amp; Add Bank Details <ExternalLink className="h-3.5 w-3.5 ml-1" />
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
              <FormLabel className="text-xs font-bold text-slate-800 dark:text-slate-200">Withdrawal Amount (₹)</FormLabel>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400 text-xs font-bold">₹</span>
                <FormControl>
                  <Input 
                    type="number"
                    placeholder="1000" 
                    className="pl-7 pr-16 text-xs h-10 rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-600"
                    disabled={isLoading || !hasBankDetails}
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
                  disabled={isLoading || availableBalance <= 0 || !hasBankDetails}
                >
                  MAX
                </Button>
              </div>
              <FormDescription className="text-[11px] text-slate-400">
                Minimum withdrawal is ₹1,000. Statutory 10% TDS (TAN: RTKP11658D) applicable, 0% platform admin fee.
              </FormDescription>
              <FormMessage className="text-[11px]" />
            </FormItem>
          )}
        />

        {/* Payout Schedule Alert */}
        <Alert className="bg-blue-50/70 text-blue-900 border border-blue-200/80 dark:bg-blue-950/30 dark:text-blue-200 dark:border-blue-900 py-3 rounded-xl">
          <AlertDescription className="text-xs leading-relaxed">
            Automatic payout processing dates: <strong>10th, 20th, and 30th (or month-end)</strong> of every month.
          </AlertDescription>
        </Alert>

        <Button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs h-10 shadow-sm transition-all" 
          disabled={isLoading || !hasBankDetails}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Proceed to Confirm <ArrowRightCircle className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
