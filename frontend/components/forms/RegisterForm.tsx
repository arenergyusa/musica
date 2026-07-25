"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, ArrowRight, ShieldCheck, User, Mail, Phone, Lock, Ticket } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

import { registerSchema, type RegisterInput } from "@/lib/validators";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RbfAgreementModal } from "../sections/RbfAgreementModal";

function RegisterFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralFromUrl = searchParams.get("invite") || searchParams.get("ref") || "";

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isAgreementOpen, setIsAgreementOpen] = useState(false);

  const [step, setStep] = useState<"REGISTER" | "OTP">("REGISTER");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [otp, setOtp] = useState("");

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      referralCode: referralFromUrl,
      agreedToRbf: false,
    },
  });

  useEffect(() => {
    if (referralFromUrl) {
      form.setValue("referralCode", referralFromUrl);
    }
  }, [referralFromUrl, form]);

  async function onSubmit(data: RegisterInput) {
    setIsLoading(true);

    try {
      await api.post("/auth/register", {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        invite_code: data.referralCode,
      });

      toast.success("OTP sent to your email!", {
        description: "Please verify your email to continue.",
      });
      setRegisteredEmail(data.email);
      setStep("OTP");
    } catch (error: any) {
      console.error("Registration error:", error);
      const msg = error?.response?.data?.message || "Registration failed. Please check your inputs.";
      toast.error("Registration Failed", { description: msg });
    } finally {
      setIsLoading(false);
    }
  }

  async function onVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/auth/register/verify", {
        email: registeredEmail,
        otp: otp,
      });

      toast.success("Account verified successfully!", {
        description: "You can now log in to your account.",
      });

      router.push("/login");
    } catch (error: any) {
      console.error("OTP Verification error:", error);
      const msg = error?.response?.data?.message || "Invalid or expired OTP. Please try again.";
      toast.error("Verification Failed", { description: msg });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {step === "REGISTER" && (
          <motion.div
            key="register"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.25 }}
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                {/* Full Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-800 dark:text-slate-200">Full Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <User className="h-4 w-4" />
                          </div>
                          <Input
                            placeholder="Enter full legal name"
                            disabled={isLoading}
                            className="pl-9 h-10 text-xs rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-blue-600 transition-all"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email */}
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
                              className="pl-9 h-10 text-xs rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-blue-600 transition-all"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />

                  {/* Phone */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-800 dark:text-slate-200">Mobile Number</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                              <Phone className="h-4 w-4" />
                            </div>
                            <Input
                              placeholder="10-digit mobile"
                              type="tel"
                              maxLength={10}
                              disabled={isLoading}
                              className="pl-9 h-10 text-xs rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-blue-600 transition-all"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Password */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-800 dark:text-slate-200">Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                              <Lock className="h-4 w-4" />
                            </div>
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Strong password"
                              disabled={isLoading}
                              className="pl-9 pr-9 h-10 text-xs rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-blue-600 transition-all"
                              {...field}
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
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />

                  {/* Confirm Password */}
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-800 dark:text-slate-200">Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                              <Lock className="h-4 w-4" />
                            </div>
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Re-enter password"
                              disabled={isLoading}
                              className="pl-9 pr-9 h-10 text-xs rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-blue-600 transition-all"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Invite Code */}
                <FormField
                  control={form.control}
                  name="referralCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Invite Code <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <Ticket className="h-4 w-4" />
                          </div>
                          <Input
                            placeholder="Enter invite code"
                            disabled={isLoading}
                            className="pl-9 h-10 text-xs rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-blue-600 transition-all bg-slate-50/60 dark:bg-slate-800/40"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                {/* Terms Agreement */}
                <FormField
                  control={form.control}
                  name="agreedToRbf"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-2.5 space-y-0 rounded-lg border border-slate-200/80 dark:border-slate-800 p-3 bg-slate-50/60 dark:bg-slate-800/40 mt-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                          className="mt-0.5 rounded border-slate-300 dark:border-slate-700 data-[state=checked]:bg-blue-600"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                          I agree to the{" "}
                          <Link href="/terms" target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline font-bold">
                            Terms of Service
                          </Link>{" "}
                          &amp;{" "}
                          <Link href="/privacy" target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline font-bold">
                            Privacy Policy
                          </Link>
                        </FormLabel>
                        <FormMessage className="text-[11px]" />
                      </div>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-11 text-xs font-bold mt-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Verify &amp; Create Account <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </motion.div>
        )}

        {step === "OTP" && (
          <motion.div
            key="otp"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center justify-center py-4"
          >
            <div className="w-12 h-12 bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 rounded-lg flex items-center justify-center mb-4 border border-blue-200/60 dark:border-blue-900">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold mb-1 text-slate-900 dark:text-white">Verify Your Email</h3>
            <p className="text-center text-xs text-slate-500 mb-5 leading-relaxed">
              We've sent a 6-digit verification code to <br />
              <span className="font-bold text-slate-900 dark:text-white">{registeredEmail}</span>
            </p>

            <form onSubmit={onVerifyOTP} className="w-full space-y-4">
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
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Verify & Complete Registration"
                )}
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
                  onClick={() => setStep("REGISTER")}
                >
                  Change email address
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <RbfAgreementModal
        open={isAgreementOpen}
        onOpenChange={setIsAgreementOpen}
        onAccept={() => form.setValue("agreedToRbf", true, { shouldValidate: true })}
      />
    </>
  );
}

export function RegisterForm() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>}>
      <RegisterFormInner />
    </Suspense>
  );
}
