"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { PasswordForm } from "@/components/forms/PasswordForm";
import { BankDetailsForm } from "@/components/forms/BankDetailsForm";
import { User, Shield, Landmark, Lock, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const { user } = useAuthStore();

  if (!user) {
    return <div className="p-8 text-center text-slate-400 text-xs font-medium">Loading creator profile...</div>;
  }

  const userData = {
    name: user.name,
    email: user.email,
    phone: user.phone,
  };

  const isKycApproved = user.kycStatus === "APPROVED";

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">

      {/* Top Banner Card */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md">
              {(user.name || "U")[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">{user.name}</h1>
                {isKycApproved ? (
                  <Badge className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900 text-[11px] font-bold">
                    <ShieldCheck className="h-3 w-3 mr-1" /> Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px]">
                    KYC Pending
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{user.email}</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-xs font-semibold border border-blue-200/80 dark:border-blue-900 shrink-0">
            <Lock className="h-3.5 w-3.5" />
            <span>256-Bit SSL Protection</span>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="personal" className="w-full flex flex-col md:flex-row gap-6">
        <TabsList className="w-full md:w-60 flex flex-col h-auto p-1.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 justify-start rounded-xl gap-1 shadow-sm">
          <TabsTrigger value="personal" className="w-full justify-start gap-2.5 py-2.5 px-3.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
            <User className="h-4 w-4" />
            <span>Personal Info</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="w-full justify-start gap-2.5 py-2.5 px-3.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
            <Shield className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="bank" className="w-full justify-start gap-2.5 py-2.5 px-3.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
            <Landmark className="h-4 w-4" />
            <span>Bank Details</span>
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 mt-0">
          <TabsContent value="personal" className="m-0 focus-visible:outline-none">
            <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Personal Information</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Update your contact details. Primary email ({userData.email}) is locked for security compliance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileForm initialData={userData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="m-0 focus-visible:outline-none">
            <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Security &amp; Password</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Ensure your account uses a strong password with at least 8 characters.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PasswordForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bank" className="m-0 focus-visible:outline-none">
            <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Settlement Bank Account</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Withdrawals will be transferred directly to this account after statutory TDS deduction (TAN: RTKP11658D).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BankDetailsForm initialData={{
                  bankAccount: user.bank_account,
                  ifsc: user.ifsc
                }} />
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

    </div>
  );
}
