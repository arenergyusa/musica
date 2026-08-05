import Link from "next/link";
import { Music, ArrowLeft, ShieldCheck } from "lucide-react";
import { APP } from "@/lib/constants";
import { ForgotPasswordForm } from "@/components/forms/ForgotPasswordForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Forgot Password | ${APP.NAME}`,
  description: "Reset your password for your Musica account.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#F8F9FA] dark:bg-[#0B0F19]">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-10">

        {/* Header Branding */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="bg-blue-600 p-2 rounded-lg text-white shadow-sm">
              <Music className="h-5 w-5 font-bold" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">{APP.NAME}</span>
          </Link>

          <Link href="/login" className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-blue-600 dark:text-slate-400 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
          </Link>
        </div>

        <ForgotPasswordForm />

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[11px] text-slate-400 font-mono">
            Musica
          </p>
        </div>
      </div>
    </div>
  );
}
