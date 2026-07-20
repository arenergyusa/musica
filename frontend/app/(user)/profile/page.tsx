/* eslint-disable */
"use client";

import { APP } from "@/lib/constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { PasswordForm } from "@/components/forms/PasswordForm";
import { BankDetailsForm } from "@/components/forms/BankDetailsForm";
import { User, Shield, Landmark } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const { user } = useAuthStore();

  if (!user) {
    return <div className="p-8 text-center text-muted-foreground">Loading profile...</div>;
  }

  const userData = {
    name: user.name,
    email: user.email,
    phone: user.phone,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Profile & Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings, security preferences, and withdrawal options.
        </p>
      </div>

      <Tabs defaultValue="personal" className="w-full flex flex-col md:flex-row gap-6">
        <TabsList className="w-full md:w-64 flex flex-col h-auto p-2 bg-muted/30 border justify-start rounded-xl gap-2">
          <TabsTrigger value="personal" className="w-full justify-start gap-3 py-3 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <User className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium text-sm">Personal Info</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="w-full justify-start gap-3 py-3 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium text-sm">Security</span>
          </TabsTrigger>
          <TabsTrigger value="bank" className="w-full justify-start gap-3 py-3 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Landmark className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium text-sm">Bank Details</span>
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 mt-0">
          <TabsContent value="personal" className="m-0 focus-visible:outline-none">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your contact details. Your email ({userData.email}) cannot be changed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileForm initialData={userData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="m-0 focus-visible:outline-none">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Ensure your account is using a long, random password to stay secure.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PasswordForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bank" className="m-0 focus-visible:outline-none">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Bank Details</CardTitle>
                <CardDescription>
                  Add or update your bank account information to receive withdrawals.
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
