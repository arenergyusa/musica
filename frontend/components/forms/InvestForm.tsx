/* eslint-disable */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Copy, Building2, Smartphone, CheckCircle2 } from "lucide-react";

import { investSchema, type InvestInput } from "@/lib/validators";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

interface InvestFormProps {
  amount: number;
  onSuccess?: () => void;
}

// Mock company payment details
const COMPANY_BANK = {
  name: "HDFC Bank",
  accountName: "Musica RBF Solutions Pvt Ltd",
  accountNumber: "50200012345678",
  ifsc: "HDFC0001234",
};
const COMPANY_UPI = "musica@hdfcbank";

export function InvestForm({ amount, onSuccess }: InvestFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const form = useForm<InvestInput>({
    resolver: zodResolver(investSchema),
    defaultValues: {
      amount: amount,
      paymentMethod: "UPI",
      paymentRef: "",
      confirmedPayment: false,
    },
  });

  const paymentMethod = form.watch("paymentMethod");

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  async function onSubmit(data: InvestInput) {
    setIsLoading(true);
    try {
      await api.post("/investment/create", {
        amount: data.amount,
      });
      
      toast.success("Investment request submitted!", {
        description: "Your payment reference is under verification. It usually takes 1-2 hours.",
      });
      
      if (onSuccess) onSuccess();
      setTimeout(() => {
        window.location.href = "/investments";
      }, 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Payment Summary */}
        <div className="bg-primary/5 rounded-lg p-4 border border-primary/20 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Amount to Pay</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(amount)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Type</p>
            <p className="font-semibold text-primary">RBF Pool Contribution</p>
          </div>
        </div>

        {/* Payment Method Selection */}
        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Select Payment Method</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-2 gap-4"
                >
                  <FormItem>
                    <FormControl>
                      <RadioGroupItem value="UPI" className="peer sr-only" />
                    </FormControl>
                    <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer">
                      <Smartphone className="mb-3 h-6 w-6" />
                      UPI Transfer
                    </FormLabel>
                  </FormItem>
                  <FormItem>
                    <FormControl>
                      <RadioGroupItem value="BANK_TRANSFER" className="peer sr-only" />
                    </FormControl>
                    <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer">
                      <Building2 className="mb-3 h-6 w-6" />
                      Bank Transfer
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Payment Instructions */}
        <div className="rounded-lg border bg-card p-5 space-y-4 shadow-sm">
          <h4 className="font-medium flex items-center text-sm">
            Please make the payment to the details below:
          </h4>
          
          {paymentMethod === "UPI" ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center py-4 bg-white rounded-lg border border-border">
                {/* Placeholder for QR Code */}
                <div className="w-32 h-32 bg-gray-100 flex items-center justify-center rounded border-2 border-dashed border-gray-300">
                  <span className="text-xs text-gray-500 font-medium">QR Code</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-medium">Scan to pay {formatCurrency(amount)}</p>
              </div>
              <div className="flex items-center justify-between bg-muted/50 p-3 rounded-md border">
                <div>
                  <p className="text-xs text-muted-foreground">UPI ID</p>
                  <p className="font-mono text-sm font-medium">{COMPANY_UPI}</p>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleCopy(COMPANY_UPI, "UPI ID")}
                >
                  {copiedText === "UPI ID" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-muted/50 p-3 rounded-md border">
                <div>
                  <p className="text-xs text-muted-foreground">Account Name</p>
                  <p className="font-medium text-sm">{COMPANY_BANK.accountName}</p>
                </div>
              </div>
              <div className="flex items-center justify-between bg-muted/50 p-3 rounded-md border">
                <div>
                  <p className="text-xs text-muted-foreground">Account Number</p>
                  <p className="font-mono text-sm font-medium">{COMPANY_BANK.accountNumber}</p>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleCopy(COMPANY_BANK.accountNumber, "Account Number")}
                >
                  {copiedText === "Account Number" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex items-center justify-between bg-muted/50 p-3 rounded-md border">
                <div>
                  <p className="text-xs text-muted-foreground">IFSC Code & Bank</p>
                  <p className="font-mono text-sm font-medium">{COMPANY_BANK.ifsc} - {COMPANY_BANK.name}</p>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleCopy(COMPANY_BANK.ifsc, "IFSC")}
                >
                  {copiedText === "IFSC" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Payment Reference Input */}
        <FormField
          control={form.control}
          name="paymentRef"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Reference / UTR Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter 12-digit UTR or Transaction ID" disabled={isLoading} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmedPayment"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md bg-muted/20">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="font-medium cursor-pointer">
                  I confirm that I have made the payment of {formatCurrency(amount)}
                </FormLabel>
                <p className="text-xs text-muted-foreground">
                  False claims may lead to account suspension.
                </p>
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting Verification...
            </>
          ) : (
            `Submit ${formatCurrency(amount)} Payment`
          )}
        </Button>
      </form>
    </Form>
  );
}
