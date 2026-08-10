"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, Wallet, Minus, Plus } from "lucide-react";
import {
  useAppKit,
  useAppKitAccount,
  useAppKitProvider,
  useDisconnect,
} from "@reown/appkit/react";
import { BrowserProvider, Contract, parseUnits, type Eip1193Provider } from "ethers";

import { investSchema, type InvestInput } from "@/lib/validators";
import { formatCurrency, shortenAddress } from "@/lib/utils";
import { USDT } from "@/lib/constants";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";

const MIN_AMOUNT = 1;
const MAX_AMOUNT = 10000;
const STEP_AMOUNT = 1;

const ERC20_TRANSFER_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
];

interface InvestFormProps {
  amount?: number;
  onSuccess?: () => void;
}

export function InvestForm({ amount, onSuccess }: InvestFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [depositAddress, setDepositAddress] = useState<string>("");
  const [investmentId, setInvestmentId] = useState<string | null>(null);

  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider<Eip1193Provider>("eip155");
  const { disconnect } = useDisconnect();

  useEffect(() => {
    api.get("/user/deposit-address")
      .then((res) => {
        if (res.data?.data?.address) {
          setDepositAddress(res.data.data.address);
        }
      })
      .catch((err) => {
        console.error("Failed to get deposit address", err);
        toast.error("Failed to load deposit address. Please try again.");
      });
  }, []);

  const form = useForm<InvestInput>({
    resolver: zodResolver(investSchema),
    defaultValues: {
      amount: amount ?? 0,
      paymentMethod: "USDT_BEP20",
    },
  });
  const selectedAmount = form.watch("amount");
  const currentAmt = selectedAmount ?? 0;

  const adjustAmount = (delta: number) => {
    const nextAmount = Math.min(MAX_AMOUNT, Math.max(0, currentAmt + delta));
    form.setValue("amount", nextAmount, { shouldDirty: true, shouldValidate: true });
  };

  // Signs and broadcasts the USDT (BEP-20) transfer from the connected wallet
  // to the shared deposit address, then returns the mined transaction hash.
  async function sendUsdtPayment(amount: number): Promise<string> {
    if (!walletProvider) throw new Error("Wallet not connected");
    if (!depositAddress) throw new Error("Deposit address not loaded yet");

    const ethersProvider = new BrowserProvider(walletProvider);
    let chainId: bigint | null = null;
    try {
      chainId = await ethersProvider.getNetwork().then((n) => n.chainId);
    } catch (error) {
      console.warn("Could not read network from wallet provider", error);
    }
    if (chainId !== null && Number(chainId) !== USDT.NETWORK_ID) {
      throw new Error(`Please switch your wallet to ${USDT.NETWORK_NAME} (BEP-20)`);
    }

    const signer = await ethersProvider.getSigner();
    const signerAddress = await signer.getAddress();
    const units = parseUnits(amount.toFixed(2), USDT.DECIMALS);

    // Pre-sign readiness check runs server-side against the backend's own BSC
    // RPC, so the browser never has to reach an external node (CSP / CORS
    // proof). The backend verifies USDT + BNB balances and gas cost.
    let readiness: {
      usdt_balance: number;
      bnb_balance: number;
      gas_cost_bnb: number;
      has_enough_usdt: boolean;
      has_enough_bnb: boolean;
    } | null = null;
    try {
      const res = await api.get("/user/deposit-check", {
        params: { wallet: signerAddress, amount },
      });
      readiness = res.data?.data ?? null;
    } catch (error) {
      if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") {
        throw new Error(error.response.data.message);
      }
      throw new Error("Unable to check your wallet. Please try again.");
    }

    if (!readiness) throw new Error("Unable to verify your wallet balance. Please try again.");

    if (!readiness.has_enough_usdt) {
      throw new Error(
        `Insufficient USDT balance. You have ${readiness.usdt_balance.toFixed(2)} USDT but need ${amount.toFixed(2)} USDT.`,
      );
    }
    if (!readiness.has_enough_bnb) {
      throw new Error(
        `Insufficient BNB for gas. Your wallet needs at least ${readiness.gas_cost_bnb.toFixed(8)} BNB to process this transfer.`,
      );
    }

    toast.info("Confirm the USDT transfer in your wallet...");
    const signerContract = new Contract(USDT.CONTRACT_ADDRESS, ERC20_TRANSFER_ABI, signer);
    const tx = await signerContract.transfer(depositAddress, units);
    toast.info("USDT transfer submitted. Waiting for on-chain confirmation...");
    await tx.wait();
    return tx.hash;
  }

  async function onSubmit(data: InvestInput) {
    if (!isConnected) {
      await open();
      return;
    }

    setIsLoading(true);
    try {
      let pendingInvestmentId = investmentId;
      if (!pendingInvestmentId) {
        const createRes = await api.post("/investment/create", {
          amount: data.amount,
          payment_method: "USDT_BEP20",
        });
        pendingInvestmentId = createRes.data?.data?.id;
        if (!pendingInvestmentId) throw new Error("Investment ID missing from server response");
        setInvestmentId(pendingInvestmentId);
      }

      const confirmHash = await sendUsdtPayment(data.amount);
      await api.post(`/investment/${pendingInvestmentId}/confirm-deposit`, { tx_hash: confirmHash });

      toast.success("Investment activated!", {
        description: "Your USDT deposit has been verified and your investment is now active.",
      });

      if (onSuccess) onSuccess();
      setTimeout(() => {
        window.location.href = "/investments";
      }, 1500);
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") {
        toast.error(error.response.data.message);
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to submit investment request. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 w-full px-0 mx-0">

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-5 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => adjustAmount(-STEP_AMOUNT)}
              disabled={isLoading || currentAmt <= 0}
              className="h-11 w-11 rounded-xl shrink-0"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="text-center flex-1">
              <p className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                {formatCurrency(currentAmt)}
              </p>
              {currentAmt > 0 && currentAmt < MIN_AMOUNT && (
                <p className="text-xs text-amber-500 font-medium mt-1">Minimum investment is ${MIN_AMOUNT}</p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => adjustAmount(STEP_AMOUNT)}
              disabled={isLoading || currentAmt >= MAX_AMOUNT}
              className="h-11 w-11 rounded-xl shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <Slider
            value={[currentAmt]}
            min={0}
            max={MAX_AMOUNT}
            step={STEP_AMOUNT}
            disabled={isLoading}
            onValueChange={(values) => {
              const nextAmount = Array.isArray(values) ? values[0] : values;
              form.setValue("amount", nextAmount, { shouldDirty: true, shouldValidate: true });
            }}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] font-bold text-slate-400">
            <span>$0</span>
            <span>$10,000</span>
          </div>
        </div>

        {/* Payment Summary Box */}
        <div className="bg-blue-50/70 dark:bg-blue-950/40 rounded-xl p-4 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Investment</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{selectedAmount === undefined ? "$0.00" : formatCurrency(selectedAmount)}</p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">
            <Wallet className="h-3.5 w-3.5" />
            <span>USDT (BEP-20)</span>
          </div>
        </div>

        {/* Wallet Connect Box */}
        <div className="bg-slate-50 dark:bg-slate-900/70 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Pay with Wallet</p>
            <p className="text-[11px] text-slate-400">
              Connect your BSC wallet to sign the USDT transfer in one click and verify automatically.
            </p>
          </div>
          {isConnected && address ? (
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-bold">
                {shortenAddress(address)}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => disconnect()}
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={() => open()}>
              Connect Wallet
            </Button>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl shadow-md transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing & Verifying Deposit...
            </>
          ) : (
            `${isConnected ? "Pay" : "Connect Wallet & Pay"} ${selectedAmount === undefined ? "$0.00" : formatCurrency(selectedAmount)}`
          )}
        </Button>

      </form>
    </Form>
  );
}
