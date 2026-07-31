"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, Copy, Wallet } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { investSchema, type InvestInput } from "@/lib/validators";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";

interface InvestFormProps {
  amount: number;
  onSuccess?: () => void;
}

export function InvestForm({ amount, onSuccess }: InvestFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingAddress, setIsFetchingAddress] = useState(true);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [depositAddress, setDepositAddress] = useState<string>("");
  const [txHash, setTxHash] = useState("");
  const [investmentId, setInvestmentId] = useState<string | null>(null);

  useEffect(() => {
    api.get("/user/deposit-address")
      .then((res) => {
        if (res.data?.data?.address) {
          setDepositAddress(res.data.data.address);
        }
      })
      .catch((err) => {
        console.error("Failed to get deposit address", err);
        toast.error("Failed to generate deposit address. Please try again.");
      })
      .finally(() => setIsFetchingAddress(false));
  }, []);

  const form = useForm<InvestInput>({
    resolver: zodResolver(investSchema),
    defaultValues: {
      amount: amount,
      paymentMethod: "USDT_BEP20",
      paymentRef: "",
      confirmedPayment: false,
    },
  });

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  async function onSubmit(data: InvestInput) {
    setIsLoading(true);
    try {
      let pendingInvestmentId = investmentId;
      if (!pendingInvestmentId) {
        const createRes = await api.post("/investment/create", {
          amount: data.amount,
          payment_method: "USDT_BEP20",
          payment_ref: depositAddress,
        });
        pendingInvestmentId = createRes.data?.data?.id;
        if (!pendingInvestmentId) throw new Error("Investment ID missing from server response");
        setInvestmentId(pendingInvestmentId);
      }
      await api.post(`/investment/${pendingInvestmentId}/confirm-deposit`, { tx_hash: txHash.trim() });

      toast.success("Investment request submitted!", {
        description: "Your USDT deposit will be credited automatically upon confirmation on the BSC network.",
      });

      if (onSuccess) onSuccess();
      setTimeout(() => {
        window.location.href = "/investments";
      }, 1500);
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to submit investment request. Please try again.");
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
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Investment</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{formatCurrency(amount)}</p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">
            <Wallet className="h-3.5 w-3.5" />
            <span>USDT (BEP-20)</span>
          </div>
        </div>

        {/* USDT BEP20 Deposit Box */}
        {isFetchingAddress ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            Generating your quick deposit address...
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-900/70 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm shrink-0">
                {depositAddress && <QRCodeSVG value={depositAddress} size={110} />}
              </div>
              <div className="space-y-2 flex-1 w-full">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Your Unique USDT (BEP-20) Deposit Address:</p>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={depositAddress}
                    className="font-mono text-xs bg-white dark:bg-slate-950 h-10 border-slate-200 dark:border-slate-800"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleCopy(depositAddress, "Deposit Address")}
                    className="h-10 px-3 shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Network: <strong className="text-slate-600 dark:text-slate-300">Binance Smart Chain (BEP-20)</strong>. Deposits sent via other networks may be lost.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="deposit-tx-hash" className="text-xs font-bold text-slate-700 dark:text-slate-300">
            BSC transaction hash
          </label>
          <Input
            id="deposit-tx-hash"
            value={txHash}
            onChange={(event) => setTxHash(event.target.value)}
            placeholder="0x..."
            className="font-mono text-xs"
          />
          <p className="text-[11px] text-slate-400">After sending USDT, paste the hash from your wallet. We verify the mined Transfer event automatically.</p>
        </div>

        {/* Confirmation Checkbox */}
        <FormField
          control={form.control}
          name="confirmedPayment"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-sm">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-xs font-bold text-slate-900 dark:text-white">
                  I have sent exactly {formatCurrency(amount)} USDT to the address above.
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isLoading || isFetchingAddress || !txHash.trim()}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl shadow-md transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying Deposit...
            </>
          ) : (
            `Submit ${formatCurrency(amount)} Investment`
          )}
        </Button>

      </form>
    </Form>
  );
}
