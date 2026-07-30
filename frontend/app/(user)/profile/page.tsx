"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { PasswordForm } from "@/components/forms/PasswordForm";
import { UsdtAddressForm } from "@/components/forms/UsdtAddressForm";
import { User, Shield, Wallet } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const { user } = useAuthStore();

  if (!user) {
    return <div className="p-8 text-center text-slate-400 text-xs font-medium">Loading profile...</div>;
  }

  const userData = {
    name: user.name,
    email: user.email,
    phone: user.phone,
  };

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
                <Badge className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900 text-[11px] font-bold">
                  Active Account
                </Badge>
              </div>
            </div>
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
          <TabsTrigger value="usdt" className="w-full justify-start gap-2.5 py-2.5 px-3.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
            <Wallet className="h-4 w-4" />
            <span>USDT (BEP-20) Address</span>
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

          <TabsContent value="usdt" className="m-0 focus-visible:outline-none">
            <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">USDT (BEP-20) Settlement Address</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Save your BSC BEP-20 USDT wallet address to receive automated withdrawal payouts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UsdtAddressForm initialAddress={user?.usdtAddress || (user as any)?.usdt_address} />
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

    </div>
  );
}
