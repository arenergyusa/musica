"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Wallet, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function UsdtAddressForm({ initialAddress }: { initialAddress?: string }) {
  const [usdtAddress, setUsdtAddress] = useState(initialAddress || "");
  const [isLoading, setIsLoading] = useState(false);
  const { user, fetchUser } = useAuthStore();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!usdtAddress.trim() || !usdtAddress.startsWith("0x") || usdtAddress.length !== 42) {
      toast.error("Please enter a valid BEP-20 USDT wallet address starting with 0x (42 characters).");
      return;
    }

    setIsLoading(true);
    try {
      await api.put("/user/profile", { usdt_address: usdtAddress.trim() });
      toast.success("USDT (BEP-20) wallet address updated successfully!");
      if (fetchUser) await fetchUser();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update USDT address.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <p className="font-bold text-slate-900 dark:text-white">BEP-20 (Binance Smart Chain) Settlement Address</p>
          <p className="text-slate-500 dark:text-slate-400">
            All withdrawal payouts will be automatically credited to this registered USDT BEP-20 wallet address. Double check your address before saving.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
          USDT (BEP-20) Wallet Address
        </Label>
        <div className="relative">
          <Input
            value={usdtAddress}
            onChange={(e) => setUsdtAddress(e.target.value)}
            placeholder="0x..."
            className="font-mono text-sm pl-10 h-11"
          />
          <Wallet className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
        </div>
        <p className="text-[11px] text-slate-400">
          Format: BSC BEP-20 42-character hex address (starts with 0x)
        </p>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-6 rounded-lg text-xs"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving Address...
          </>
        ) : (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Save USDT Address
          </>
        )}
      </Button>
    </form>
  );
}
