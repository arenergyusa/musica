/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Landmark, CheckCircle2, XCircle } from "lucide-react";

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
import { Alert, AlertDescription } from "@/components/ui/alert";

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
        // Optionally clear bank name when IFSC is changed/invalid
        if (watchIfsc && watchIfsc.length < 11) {
          // form.setValue("bankName", "");
        }
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
      await fetchUser(); // Reload user state
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save bank details.");
    } finally {
      setIsLoading(false);
    }
  }

  const isInvalidIfsc = branchInfo.includes("Invalid") || branchInfo.includes("Could not");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        <Alert className="bg-primary/5 text-primary border-primary/20 mb-6">
          <Landmark className="h-4 w-4" />
          <AlertDescription>
            Please ensure that the Account Holder Name matches your KYC documents exactly. 
            Mismatched details may lead to withdrawal rejections.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="accountHolder"
            render={({ field }) => (
               <FormItem>
                <FormLabel>Account Holder Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" readOnly className="bg-muted cursor-not-allowed" {...field} />
                </FormControl>
                <FormDescription>Prefilled from your registered name.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="bankName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bank Name</FormLabel>
                <FormControl>
                  <Input placeholder="State Bank of India" readOnly className="bg-muted cursor-not-allowed" {...field} />
                </FormControl>
                <FormDescription>Auto-filled from IFSC code.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="accountNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Number</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter Account Number" 
                    type="password" 
                    disabled={isLoading} 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="confirmAccountNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Account Number</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Re-enter Account Number" 
                    type="text" 
                    disabled={isLoading} 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="ifsc"
          render={({ field }) => (
            <FormItem className="md:w-[calc(50%-12px)]">
              <FormLabel>IFSC Code</FormLabel>
              <FormControl>
                <Input 
                  placeholder="SBIN0001234" 
                  className="uppercase"
                  disabled={isLoading} 
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <FormDescription>
                11-character alphanumeric code found on your cheque book
              </FormDescription>
              {isFetchingIfsc && (
                <div className="flex items-center text-sm text-muted-foreground mt-2">
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  Fetching branch details...
                </div>
              )}
              {!isFetchingIfsc && branchInfo && (
                <div className={`flex items-center text-sm mt-2 font-medium ${isInvalidIfsc ? 'text-destructive' : 'text-green-600 dark:text-green-500'}`}>
                  {isInvalidIfsc ? (
                    <XCircle className="h-3.5 w-3.5 mr-1.5" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  {branchInfo}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4 border-t">
          <Button type="submit" disabled={isLoading || isFetchingIfsc || isInvalidIfsc || (form.formState.isDirty === false && watchIfsc?.length !== 11)}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Landmark className="mr-2 h-4 w-4" />
            )}
            Save Bank Details
          </Button>
        </div>
      </form>
    </Form>
  );
}
