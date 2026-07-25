"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, KeyRound, Lock, Eye, EyeOff } from "lucide-react";

import { changePasswordSchema, type ChangePasswordInput } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { api } from "@/lib/api";

export function PasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: ChangePasswordInput) {
    setIsLoading(true);
    try {
      await api.put("/user/password", {
        old_password: data.currentPassword,
        new_password: data.newPassword,
      });
      
      toast.success("Password updated successfully!", {
        description: "Use your new password on your next login.",
      });
      form.reset();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to change password.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold text-slate-800 dark:text-slate-200">Current Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input 
                    type={showCurrent ? "text" : "password"} 
                    placeholder="Enter current password" 
                    disabled={isLoading} 
                    className="pl-9 pr-9 h-10 text-xs rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-blue-600 transition-all"
                    {...field} 
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400"
                    onClick={() => setShowCurrent(!showCurrent)}
                  >
                    {showCurrent ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage className="text-[11px]" />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold text-slate-800 dark:text-slate-200">New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <Input 
                      type={showNew ? "text" : "password"} 
                      placeholder="At least 8 characters" 
                      disabled={isLoading} 
                      className="pl-9 pr-9 h-10 text-xs rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-blue-600 transition-all"
                      {...field} 
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400"
                      onClick={() => setShowNew(!showNew)}
                    >
                      {showNew ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage className="text-[11px]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold text-slate-800 dark:text-slate-200">Confirm New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <Input 
                      type={showConfirm ? "text" : "password"} 
                      placeholder="Re-enter new password" 
                      disabled={isLoading} 
                      className="pl-9 pr-9 h-10 text-xs rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-blue-600 transition-all"
                      {...field} 
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400"
                      onClick={() => setShowConfirm(!showConfirm)}
                    >
                      {showConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage className="text-[11px]" />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button 
            type="submit" 
            disabled={isLoading}
            className="h-10 text-xs font-bold px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            Update Password
          </Button>
        </div>
      </form>
    </Form>
  );
}
