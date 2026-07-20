/* eslint-disable */
"use client";

import { useState } from "react";
import { APP } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Wallet, Landmark, AlertCircle, Info, Clock, CheckCircle2, XCircle } from "lucide-react";
import { WithdrawForm } from "@/components/forms/WithdrawForm";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useEffect } from "react";
import { api } from "@/lib/api";
const IS_BANK_VERIFIED = true; // Toggle this to test the unverified state



export default function WithdrawPage() {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBalance() {
      try {
        const response = await api.get("/wallet/balance");
        setBalance(response.data.data.balance || 0);
      } catch (error) {
        console.error("Error fetching balance:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBalance();
  }, []);
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PROCESSED":
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30"><CheckCircle2 className="mr-1 h-3 w-3"/> Processed</Badge>;
      case "PENDING":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30"><Clock className="mr-1 h-3 w-3"/> Pending</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30"><XCircle className="mr-1 h-3 w-3"/> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Withdraw Funds</h1>
        <p className="text-muted-foreground">
          Transfer your reward wallet balance directly to your verified bank account.
        </p>
      </div>

      {!IS_BANK_VERIFIED && (
        <Alert variant="destructive" className="bg-rose-500/10 text-rose-600 border-rose-500/30">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Bank Account Not Verified</AlertTitle>
          <AlertDescription className="flex items-center justify-between mt-2">
            <span>You need to add a verified bank account to your profile before you can withdraw funds.</span>
            <Link href="/profile">
              <Button variant="outline" size="sm" className="bg-background">
                Add Bank Details
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form & Balance */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-primary/20 bg-primary/5">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-primary/20 p-3 rounded-full">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Available Balance</p>
                  <p className="text-2xl font-bold text-foreground">
                    {isLoading ? "..." : formatCurrency(balance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Submit Request</CardTitle>
              <CardDescription>Withdrawals are subject to 5% Admin Charge and 5% TDS (Total 10% Deduction).</CardDescription>
            </CardHeader>
            <CardContent>
              {IS_BANK_VERIFIED ? (
                !isLoading ? <WithdrawForm availableBalance={balance} /> : <div>Loading...</div>
              ) : (
                <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                  <Landmark className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Please add your bank details first.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Rules Info */}
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <CardTitle className="text-lg flex items-center">
                <Info className="h-5 w-5 mr-2 text-primary" />
                Withdrawal Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-sm text-muted-foreground">
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <p><strong className="text-foreground">Minimum Amount:</strong> ₹1,000 per transaction.</p>
              </div>
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <p><strong className="text-foreground">Maximum Amount:</strong> Up to available balance.</p>
              </div>
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <p><strong className="text-foreground">Deductions:</strong> 5% Admin Fee + 5% TDS will be deducted from your requested amount.</p>
              </div>
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <p><strong className="text-foreground">Processing Time:</strong> Requests are processed within 24-48 working hours.</p>
              </div>
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <p><strong className="text-foreground">Bank Details:</strong> Funds will only be sent to the bank account matching your KYC name.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* History Table */}
      <Card className="shadow-sm border">
        <div className="p-6 border-b bg-muted/10">
          <CardTitle className="text-lg">Recent Withdrawals</CardTitle>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="pl-6">Request Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Deductions (10%)</TableHead>
                <TableHead className="font-semibold text-foreground">Net Received</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Processed On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No withdrawal requests found.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}
