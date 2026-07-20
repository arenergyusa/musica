/* eslint-disable */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, ArrowRightCircle, Building, Wallet } from "lucide-react";

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
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WithdrawFormProps {
  availableBalance: number;
  onSuccess?: () => void;
}

import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function WithdrawForm({ availableBalance, onSuccess }: WithdrawFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();

  const form = useForm<WithdrawInput>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: {
      amount: undefined, // undefined initially so input is empty, not 0
    },
  });

  async function onSubmit(data: WithdrawInput) {
    if (data.amount > availableBalance) {
      form.setError("amount", {
        type: "manual",
        message: "Insufficient balance for this withdrawal.",
      });
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/withdrawal/request", {
        amount: data.amount,
      });
      
      toast.success("Withdrawal request submitted!", {
        description: `${formatCurrency(data.amount)} will be credited to your bank account within 24 hours.`,
      });
      
      form.reset();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit withdrawal request.");
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Balance Display */}
        <div className="bg-muted/50 p-4 rounded-lg border flex items-center justify-between">
          <div className="flex items-center text-muted-foreground">
            <Wallet className="h-5 w-5 mr-2 text-primary" />
            <span className="text-sm font-medium">Available Balance</span>
          </div>
          <span className="text-lg font-bold text-foreground">
            {formatCurrency(availableBalance)}
          </span>
        </div>

        {/* Bank Details Preview */}
        <div className="rounded-lg border bg-card p-4 space-y-2 shadow-sm border-l-4 border-l-primary">
          <h4 className="font-semibold flex items-center text-sm">
            <Building className="h-4 w-4 mr-2" />
            Withdrawal Bank Account
          </h4>
          <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
            <p className="font-medium text-foreground">{user?.name || "Bank Account"}</p>
            <p>A/C: <span className="font-mono">{user?.bank_account || "Not Set"}</span></p>
            <p>IFSC: <span className="font-mono">{user?.ifsc || "Not Set"}</span></p>
          </div>
        </div>

        {/* Amount Input */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Withdrawal Amount (₹)</FormLabel>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-muted-foreground">₹</span>
                <FormControl>
                  <Input 
                    type="number"
                    placeholder="1000" 
                    className="pl-7 pr-16"
                    disabled={isLoading}
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                  />
                </FormControl>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="absolute right-1 h-7 text-xs font-semibold text-primary hover:text-primary"
                  onClick={handleMaxAmount}
                  disabled={isLoading || availableBalance <= 0}
                >
                  MAX
                </Button>
              </div>
              <FormDescription>
                Minimum withdrawal is ₹1,000. 5% admin charge is applicable.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Warning Alert */}
        <Alert className="bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-500 py-3">
          <AlertDescription className="text-xs">
            Withdrawal requests are processed every day between 10 AM to 6 PM. Requests placed on weekends may take longer.
          </AlertDescription>
        </Alert>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Submit Request <ArrowRightCircle className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
