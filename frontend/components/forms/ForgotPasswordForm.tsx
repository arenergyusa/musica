"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, KeyRound, Mail, ShieldCheck, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const router = useRouter();

  const [step, setStep] = useState<"EMAIL" | "OTP" | "RESET">("EMAIL");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      toast.success("OTP sent to your email!");
      setStep("OTP");
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/auth/forgot-password/verify", { email, otp });
      toast.success("OTP verified!");
      setStep("RESET");
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Invalid or expired OTP. Please try again.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      toast.error("Password must be at least 8 characters, contain one uppercase letter and one number");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/auth/forgot-password/reset", {
        email,
        otp,
        password,
      });
      toast.success("Password reset successfully!", {
        description: "You can now log in with your new password.",
      });
      router.push("/login");
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {step === "EMAIL" && (
          <motion.form
            key="email"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            onSubmit={handleSendOTP}
            className="space-y-5"
          >
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 rounded-lg flex items-center justify-center mb-3 border border-blue-200/60 dark:border-blue-900">
                <Mail className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Reset Password</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 leading-relaxed max-w-xs">
                Enter your registered email address to receive a 6-digit verification code.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Email Address</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className="pl-9 h-11 text-xs rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-blue-600 transition-all"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-11 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Reset Code"}
            </Button>
          </motion.form>
        )}

        {step === "OTP" && (
          <motion.form
            key="otp"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.25 }}
            onSubmit={handleVerifyOTP}
            className="space-y-5"
          >
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 rounded-lg flex items-center justify-center mb-3 border border-blue-200/60 dark:border-blue-900">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Verify Code</h2>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                We've sent a 6-digit code to <br />
                <span className="font-bold text-slate-900 dark:text-white">{email}</span>
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Verification Code</label>
              <Input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit code"
                className="h-11 text-center text-lg tracking-[0.4em] font-mono bg-white dark:bg-slate-900 rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-600"
                maxLength={6}
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full h-11 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading || otp.length !== 6}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Continue"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
                onClick={() => setStep("EMAIL")}
              >
                Change email address
              </button>
            </div>
          </motion.form>
        )}

        {step === "RESET" && (
          <motion.form
            key="reset"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            onSubmit={handleResetPassword}
            className="space-y-4"
          >
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 rounded-lg flex items-center justify-center mb-3 border border-blue-200/60 dark:border-blue-900">
                <KeyRound className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create New Password</h2>
              <p className="text-slate-500 text-xs mt-1">
                Enter your new password below.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">New Password</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="pl-9 pr-9 h-11 text-xs rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-600"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Confirm Password</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    className="pl-9 h-11 text-xs rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white mt-2" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save New Password"}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
