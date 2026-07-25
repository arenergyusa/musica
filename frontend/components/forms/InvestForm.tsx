"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, Copy, Building2, Smartphone, CheckCircle2, ShieldCheck } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

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

export function InvestForm({ amount, onSuccess }: InvestFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSettings, setIsFetchingSettings] = useState(true);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    api.get("/settings").then((res) => {
      setSettings(res.data.data);
    }).catch((err) => {
      console.error(err);
      setFetchError("Failed to load payment settings. Please refresh or contact support.");
    }).finally(() => setIsFetchingSettings(false));
  }, []);

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
        payment_method: data.paymentMethod,
        payment_ref: data.paymentRef,
      });
      
      toast.success("Sponsorship request submitted!", {
        description: "Your payment reference is under verification by accounting. Status will update shortly.",
      });
      
      if (onSuccess) onSuccess();
      setTimeout(() => {
        window.location.href = "/investments";
      }, 1500);
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && typeof error.response?.data?.message === 'string') {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to submit sponsorship request. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        
        {/* Payment Summary Box */}
        <div className="bg-blue-50/70 dark:bg-blue-950/40 rounded-xl p-4 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Sponsorship</p>
            <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">{formatCurrency(amount)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Contribution Pool</p>
            <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Haryanvi Project RBF</p>
          </div>
        </div>

        {/* Payment Method Selection */}
        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="text-xs font-bold text-slate-800 dark:text-slate-200">Select Payment Method</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-2 gap-3"
                >
                  <FormItem>
                    <FormControl>
                      <RadioGroupItem value="UPI" className="peer sr-only" />
                    </FormControl>
                    <FormLabel className="flex flex-col items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50/50 dark:peer-data-[state=checked]:bg-blue-950/40 cursor-pointer transition-all">
                      <Smartphone className="mb-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">UPI Transfer</span>
                    </FormLabel>
                  </FormItem>
                  <FormItem>
                    <FormControl>
                      <RadioGroupItem value="BANK_TRANSFER" className="peer sr-only" />
                    </FormControl>
                    <FormLabel className="flex flex-col items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50/50 dark:peer-data-[state=checked]:bg-blue-950/40 cursor-pointer transition-all">
                      <Building2 className="mb-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Bank Transfer</span>
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage className="text-[11px]" />
            </FormItem>
          )}
        />

        {/* Payment Instructions Details */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4 shadow-sm">
          <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Official Remittance Account Details:
          </h4>
          
          {isFetchingSettings ? (
            <div className="flex justify-center p-6"><Loader2 className="animate-spin h-6 w-6 text-blue-600" /></div>
          ) : paymentMethod === "UPI" ? (
            <div className="space-y-3">
              <div className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  {settings?.payment_upi_id ? (
                    <QRCodeSVG 
                      value={`upi://pay?pa=${encodeURIComponent(settings.payment_upi_id)}&pn=${encodeURIComponent(settings.payment_account_name || 'Musica')}&am=${encodeURIComponent(amount)}&cu=INR`} 
                      size={160} 
                      level="H"
                      includeMargin={true}
                    />
                  ) : (
                    <span className="text-xs text-red-500 font-medium px-2 text-center">{fetchError || "QR Code Unavailable"}</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">Scan with any UPI App to pay {formatCurrency(amount)}</p>
              </div>
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-[11px] text-slate-400">Official UPI VPA</p>
                  <p className="font-mono text-xs font-bold text-slate-900 dark:text-white">{settings?.payment_upi_id || (fetchError ? 'Failed to load' : 'Not configured')}</p>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  className="h-8 text-xs font-semibold" 
                  onClick={() => handleCopy(settings?.payment_upi_id || '', "UPI ID")}
                  disabled={!settings?.payment_upi_id}
                >
                  {copiedText === "UPI ID" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-[11px] text-slate-400">Beneficiary Name</p>
                  <p className="font-bold text-xs text-slate-900 dark:text-white">{settings?.payment_account_name || (fetchError ? 'Failed to load' : 'Not configured')}</p>
                </div>
              </div>
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-[11px] text-slate-400">Account Number</p>
                  <p className="font-mono text-xs font-bold text-slate-900 dark:text-white">{settings?.payment_account_number || 'Not configured'}</p>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  className="h-8 text-xs font-semibold"
                  onClick={() => handleCopy(settings?.payment_account_number || '', "Account Number")}
                  disabled={!settings?.payment_account_number}
                >
                  {copiedText === "Account Number" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-[11px] text-slate-400">IFSC Code & Bank</p>
                  <p className="font-mono text-xs font-bold text-slate-900 dark:text-white">{settings?.payment_ifsc || 'N/A'} - {settings?.payment_bank_name || 'N/A'}</p>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  className="h-8 text-xs font-semibold"
                  onClick={() => handleCopy(settings?.payment_ifsc || '', "IFSC")}
                  disabled={!settings?.payment_ifsc}
                >
                  {copiedText === "IFSC" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
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
              <FormLabel className="text-xs font-bold text-slate-800 dark:text-slate-200">Transaction Reference / UTR Number</FormLabel>
              <FormControl>
                <Input 
                  placeholder="12-digit UTR or IMPS reference ID" 
                  disabled={isLoading} 
                  className="h-10 text-xs rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-600"
                  {...field} 
                />
              </FormControl>
              <FormMessage className="text-[11px]" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmedPayment"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                  className="mt-0.5"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="font-bold text-xs text-slate-800 dark:text-slate-200 cursor-pointer">
                  I confirm that I have transferred {formatCurrency(amount)}
                </FormLabel>
                <p className="text-[11px] text-slate-400">
                  Transfers are audited against corporate bank logs.
                </p>
              </div>
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full h-11 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all" 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting Verification...
            </>
          ) : (
            `Submit ${formatCurrency(amount)} Sponsorship`
          )}
        </Button>
      </form>
    </Form>
  );
}
