"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type KycAuditUser = { id: string; name: string; email: string; kyc_status: string; created_at: string };

export default function AdminKycPage() {
  const [records, setRecords] = useState<KycAuditUser[]>([]);
  useEffect(() => { api.get("/admin/kyc").then((response) => setRecords(response.data.data || [])).catch(() => setRecords([])); }, []);

  return <div className="space-y-6">
    <div><h1 className="text-3xl font-bold tracking-tight">Automated KYC</h1><p className="mt-2 text-sm text-muted-foreground">OCR, Aadhaar/PAN name matching, and live-selfie verification determine KYC status automatically. Manual approval and rejection are disabled.</p></div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-5 w-5 text-emerald-600" />Verification audit</CardTitle></CardHeader><CardContent className="space-y-3">{records.length ? records.map((record) => <div key={record.id} className="flex items-center justify-between rounded-lg border p-3"><div><p className="text-sm font-semibold">{record.name}</p><p className="text-xs text-muted-foreground">{record.email}</p></div><Badge variant="outline" className="gap-1">{record.kyc_status === "APPROVED" ? <ShieldCheck className="h-3 w-3 text-emerald-600" /> : record.kyc_status === "REJECTED" ? <ShieldAlert className="h-3 w-3 text-rose-600" /> : <Clock className="h-3 w-3 text-amber-600" />}{record.kyc_status}</Badge></div>) : <p className="py-8 text-center text-sm text-muted-foreground">No automated KYC records awaiting attention.</p>}</CardContent></Card>
  </div>;
}
