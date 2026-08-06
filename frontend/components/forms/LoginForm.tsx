"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Mail, Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";

import { loginSchema, type LoginInput } from "@/lib/validators";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120 } }
};

export function LoginForm() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    if (searchParams.get("session_expired") === "true") {
      toast.error("Session expired. Please log in again.");
    }
  }, [searchParams]);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  async function onSubmit(data: LoginInput) {
    setIsLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email: data.email,
        password: data.password,
        remember_me: data.rememberMe,
      });

      // The JWT lives in an httpOnly, Secure cookie set by the backend
      // (M29); do not mirror it into localStorage or a JS-readable cookie.
      const { user } = response.data.data;

      toast.success("Login successful!", {
        description: `Welcome back, ${user.name ? user.name.split(' ')[0] : 'user'}!`,
      });

      await fetchUser();
      const userRole = String(user.role || '').toLowerCase();
      if (userRole === 'admin' || userRole === 'super_admin') {
        window.location.assign("/admin/dashboard");
      } else {
        window.location.assign("/dashboard");
      }
    } catch (error: unknown) {
      let message = "Invalid email or password";
      if (axios.isAxiosError(error) && typeof error.response?.data?.message === 'string') {
        message = error.response.data.message;
      }
      form.setError("root", {
        type: "manual",
        message: message,
      });
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">

          {form.formState.errors.root && (
            <motion.div variants={itemVariants} className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-semibold text-xs rounded-lg border border-red-200 dark:border-red-900 text-center">
              {form.formState.errors.root.message}
            </motion.div>
          )}

          {/* Email Field with Mail Trust Badge */}
          <motion.div variants={itemVariants}>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-slate-800 dark:text-slate-200">Email Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Mail className="h-4 w-4" />
                      </div>
                      <Input
                        placeholder="Enter your email address"
                        type="email"
                        disabled={isLoading}
                        className="pl-9 h-11 text-xs rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-blue-600 transition-all"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />
          </motion.div>

          {/* Password Field with Lock Icon */}
          <motion.div variants={itemVariants}>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between mb-1">
                    <FormLabel className="text-xs font-bold text-slate-800 dark:text-slate-200">Password</FormLabel>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Lock className="h-4 w-4" />
                      </div>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter account password"
                        disabled={isLoading}
                        className="pl-9 pr-10 h-11 text-xs rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-blue-600 transition-all"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />
          </motion.div>

          {/* Remember Me */}
          <motion.div variants={itemVariants}>
            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2.5 space-y-0 pt-1">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                      className="rounded border-slate-300 dark:border-slate-700 data-[state=checked]:bg-blue-600"
                    />
                  </FormControl>
                  <FormLabel className="cursor-pointer text-xs text-slate-600 dark:text-slate-400 font-medium">
                    Remember account for 30 days
                  </FormLabel>
                </FormItem>
              )}
            />
          </motion.div>

          {/* Primary Trigger Button */}
          <motion.div variants={itemVariants} className="pt-2">
            <Button
              type="submit"
              className="w-full h-11 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" /> Sign In to Account
                </>
              )}
            </Button>
          </motion.div>

        </motion.div>
      </form>
    </Form>
  );
}
