/* eslint-disable */
"use client";

import { ShieldAlert, ShieldCheck, Clock } from "lucide-react";
import { KycForm } from "@/components/forms/KycForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function KycPage() {
  const [kycStatus, setKycStatus] = useState<"UNINITIALIZED" | "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED">("UNINITIALIZED");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const response = await api.get("/user/kyc/status");
        setKycStatus(response.data.data.status || "UNINITIALIZED");
        setRejectionReason(response.data.data.rejection_reason || "");
      } catch (error) {
        console.error("Failed to fetch KYC status", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStatus();
  }, []);

  if (isLoading) {
    return <div className="max-w-4xl mx-auto p-8 text-center text-muted-foreground">Loading KYC status...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">KYC Verification</h1>
        <p className="text-muted-foreground">
          Verify your identity to unlock investment features and withdrawals.
        </p>
      </div>

      {(kycStatus === "APPROVED" || kycStatus === "COMPLETED") && (
        <Alert className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400">
          <ShieldCheck className="h-5 w-5" />
          <AlertTitle className="text-base font-semibold">Verification Complete</AlertTitle>
          <AlertDescription className="mt-1">
            Your KYC documents have been successfully verified. You can now invest in all available funds.
          </AlertDescription>
        </Alert>
      )}

      {kycStatus === "PENDING" && (
        <Alert className="bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-500">
          <Clock className="h-5 w-5" />
          <AlertTitle className="text-base font-semibold">Verification Pending</AlertTitle>
          <AlertDescription className="mt-1">
            Your documents are currently under review by our admin team. This process usually takes 24-48 hours.
            You will be notified once the review is complete.
          </AlertDescription>
        </Alert>
      )}

      {kycStatus === "REJECTED" && (
        <Alert variant="destructive">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle className="text-base font-semibold">Verification Rejected</AlertTitle>
          <AlertDescription className="mt-1">
            <p className="mb-2">Your KYC application was rejected for the following reason:</p>
            <p className="font-medium bg-destructive/10 p-2 rounded-md mb-2">
              "{rejectionReason || "Your document did not meet our verification criteria."}"
            </p>
            <p>Please re-submit your documents below.</p>
          </AlertDescription>
        </Alert>
      )}

      {(kycStatus === "UNINITIALIZED" || kycStatus === "REJECTED") && (
        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-primary flex items-center">
                <ShieldAlert className="h-5 w-5 mr-2" /> Security Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <ul className="list-disc pl-5 space-y-1">
                <li>Ensure all corners of the document are visible.</li>
                <li>Avoid glare and shadows on the document.</li>
                <li>The name on your documents must exactly match the name on your Musica profile.</li>
                <li>Allowed file types: JPG, PNG, PDF (Max 5MB per file).</li>
              </ul>
            </CardContent>
          </Card>

          <KycForm />
        </div>
      )}
    </div>
  );
}
