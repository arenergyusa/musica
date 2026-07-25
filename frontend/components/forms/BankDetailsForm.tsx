"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, Landmark, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";

import { bankDetailsSchema, type BankDetailsInput } from "@/lib/validators";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function BankDetailsForm({ initialData }: { initialData?: { bankAccount?: string; ifsc?: string } }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingIfsc, setIsFetchingIfsc] = useState(false);
  const [branchInfo, setBranchInfo] = useState("");
  const { user, fetchUser } = useAuthStore();

  const form = useForm<BankDetailsInput>({
    resolver: zodResolver(bankDetailsSchema),
    defaultValues: {
      accountHolder: user?.name || "",
      bankName: "",
      accountNumber: initialData?.bankAccount || "",
      confirmAccountNumber: initialData?.bankAccount || "",
      ifsc: initialData?.ifsc || "",
    },
  });

  const watchIfsc = form.watch("ifsc");

  useEffect(() => {
    if (user?.name && !form.getValues("accountHolder")) {
      form.setValue("accountHolder", user.name, { shouldValidate: true });
    }
  }, [user, form]);

  useEffect(() => {
    const fetchBankDetails = async () => {
      if (watchIfsc && watchIfsc.length === 11) {
        setIsFetchingIfsc(true);
        setBranchInfo("");
        try {
          const res = await fetch(`https://ifsc.razorpay.com/${watchIfsc}`);
          if (res.ok) {
            const data = await res.json();
            form.setValue("bankName", data.BANK, { shouldValidate: true, shouldDirty: true });
            setBranchInfo(`${data.BRANCH}, ${data.CITY}, ${data.STATE}`);
          } else {
            setBranchInfo("Invalid IFSC Code");
          }
        } catch (error) {
          setBranchInfo("Could not fetch branch details");
        } finally {
          setIsFetchingIfsc(false);
        }
      } else {
        setBranchInfo("");
      }
    };

    const timeoutId = setTimeout(() => {
      fetchBankDetails();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [watchIfsc, form]);

  async function onSubmit(data: BankDetailsInput) {
    setIsLoading(true);
    try {
      await api.put("/user/profile", {
        bank_account: data.accountNumber,
        ifsc: data.ifsc,
      });

      toast.success("Bank details saved successfully!", {
        description: "Your withdrawals will now be sent to this account.",
      });
      await fetchUser();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save bank details.");
    } finally {
      setIsLoading(false);
    }
  }

  const isInvalidIfsc = branchInfo.includes("Invalid") || branchInfo.includes("Could not");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

        <div className="p-3.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 flex items-start gap-2.5">
          <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            Ensure Account Holder Name matches your KYC documents exactly. Mismatched details may lead to withdrawal rejections.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="accountHolder"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold text-slate-800 dark:text-slate-200">Account Holder Name</FormLabel>
                <FormControl>
                  <Input readOnly className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 cursor-not-allowed h-10 text-xs rounded-lg border-slate-200 dark:border-slate-800" {...field} />
                </FormControl>
                <FormDescription className="text-[11px] text-slate-400">Prefilled from your registered legal name.</FormDescription>
                <FormMessage className="text-[11px]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bankName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold text-slate-800 dark:text-slate-200">Bank Name</FormLabel>
                <FormControl>
                  <Input placeholder="Auto-detected from IFSC" readOnly className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 cursor-not-allowed h-10 text-xs rounded-lg border-slate-200 dark:border-slate-800" {...field} />
                </FormControl>
                <FormDescription className="text-[11px] text-slate-400">Auto-filled via IFSC branch lookup.</FormDescription>
                <FormMessage className="text-[11px]" />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="accountNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold text-slate-800 dark:text-slate-200">Account Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter account number"
                    type="password"
                    disabled={isLoading}
                    className="h-10 text-xs rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-blue-600"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-[11px]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmAccountNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold text-slate-800 dark:text-slate-200">Confirm Account Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Re-enter account number"
                    type="text"
                    disabled={isLoading}
                    className="h-10 text-xs rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-blue-600"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-[11px]" />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="ifsc"
          render={({ field }) => (
            <FormItem className="md:w-[calc(50%-8px)]">
              <FormLabel className="text-xs font-bold text-slate-800 dark:text-slate-200">IFSC Code</FormLabel>
              <FormControl>
                <Input
                  placeholder="SBIN0001234"
                  className="uppercase h-10 text-xs rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-blue-600"
                  disabled={isLoading}
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <FormDescription className="text-[11px] text-slate-400">
                11-character code (e.g. SBIN0001234)
              </FormDescription>
              {isFetchingIfsc && (
                <div className="flex items-center text-xs text-slate-400 mt-1">
                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                  Fetching branch details...
                </div>
              )}
              {!isFetchingIfsc && branchInfo && (
                <div className={`flex items-center text-xs mt-1.5 font-semibold ${isInvalidIfsc ? 'text-red-600' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {isInvalidIfsc ? (
                    <XCircle className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                  )}
                  {branchInfo}
                </div>
              )}
              <FormMessage className="text-[11px]" />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="submit"
            disabled={isLoading || isFetchingIfsc || isInvalidIfsc || (form.formState.isDirty === false && watchIfsc?.length !== 11)}
            className="h-10 text-xs font-bold px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Landmark className="h-4 w-4" />
            )}
            Save Bank Details
          </Button>
        </div>
      </form>
    </Form>
  );
}
