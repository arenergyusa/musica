/* eslint-disable */
"use client";

import { ShieldAlert, ShieldCheck, Clock, Lock } from "lucide-react";
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
    return <div className="max-w-4xl mx-auto p-8 text-center text-slate-400 font-medium">Loading KYC verification status...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">KYC Verification</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Camera-only Aadhaar, PAN, and live-selfie verification with automatic approval after successful checks.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-xs font-semibold border border-blue-200/80 dark:border-blue-900 shrink-0">
          <Lock className="h-3.5 w-3.5" />
          <span>256-Bit SSL Encrypted</span>
        </div>
      </div>

      {(kycStatus === "APPROVED" || kycStatus === "COMPLETED") && (
        <Alert className="bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-100 dark:border-emerald-900 rounded-lg shadow-sm">
          <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <AlertTitle className="text-sm font-bold">Identity Verification Completed</AlertTitle>
          <AlertDescription className="text-xs mt-1 text-emerald-800 dark:text-emerald-300">
            Your KYC documents have been successfully verified. Unlimited withdrawals and project sponsorships are unlocked.
          </AlertDescription>
        </Alert>
      )}

      {kycStatus === "PENDING" && (
        <Alert className="bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/30 dark:text-blue-100 dark:border-blue-900 rounded-lg shadow-sm">
          <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-sm font-bold">Verification In Progress</AlertTitle>
          <AlertDescription className="text-xs mt-1 text-blue-800 dark:text-blue-300">
            Your secure camera scans are being verified automatically. Keep this page open until verification completes.
          </AlertDescription>
        </Alert>
      )}

      {kycStatus === "REJECTED" && (
        <Alert variant="destructive" className="rounded-lg shadow-sm">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle className="text-sm font-bold">Verification Failed</AlertTitle>
          <AlertDescription className="text-xs mt-1">
            <p className="mb-1.5">Your submission could not be verified due to:</p>
            <p className="font-semibold bg-red-100/50 dark:bg-red-950/50 p-2 rounded-md mb-2 text-xs">
              "{rejectionReason || "Uploaded documents were blurry or missing required details."}"
            </p>
            <p>Please retake clear camera scans and a live selfie below.</p>
          </AlertDescription>
        </Alert>
      )}

      {(kycStatus === "UNINITIALIZED" || kycStatus === "REJECTED") && (
        <div className="space-y-6">
          <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                <Lock className="h-4 w-4 mr-2 text-blue-600" /> Verification Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
              <ul className="list-disc pl-4 space-y-1">
                <li>Use the rear camera for Aadhaar and PAN; gallery/file upload is disabled.</li>
                <li>Use the front camera for a live selfie; one face must be clearly visible.</li>
                <li>Aadhaar and PAN names are extracted automatically and must match.</li>
              </ul>
            </CardContent>
          </Card>

          <KycForm />
        </div>
      )}
    </div>
  );
}
