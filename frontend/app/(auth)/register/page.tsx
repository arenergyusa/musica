import { Suspense } from "react";
import Link from "next/link";
import { Music, CheckCircle2, ShieldCheck, Sparkles, Loader2 } from "lucide-react";
import { APP } from "@/lib/constants";
import { RegisterForm } from "@/components/forms/RegisterForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Register | ${APP.NAME}`,
  description: "Create your free Musica account to stream official Haryanvi music videos & studio tracks.",
};

const benefits = [
  "Instant access to high-definition Haryanvi music videos",
  "Official studio sound quality and artist premieres",
  "Create custom playlists and save favorite songs",
  "100% free account registration with secure verification"
];

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#F8F9FA] dark:bg-[#0B0F19]">
      <div className="w-full max-w-5xl flex flex-col lg:flex-row bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Left Panel - Branding */}
        <div className="hidden lg:flex w-1/2 bg-slate-900 dark:bg-slate-950 flex-col justify-between p-10 xl:p-12 relative overflow-hidden text-white border-r border-slate-800">
          {/* Ambient Glows */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-blue-600/20 rounded-full filter blur-3xl opacity-60" />
            <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-emerald-500/15 rounded-full filter blur-3xl opacity-50" />
          </div>

          <div className="relative z-10">
            <Link href="/" className="flex items-center space-x-3 w-fit">
              <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-md">
                <Music className="h-6 w-6" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-white">{APP.NAME}</span>
            </Link>
            
            <div className="mt-16">
              <div className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-4 border border-emerald-500/20">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Free Account Access</span>
              </div>

              <h1 className="text-3xl xl:text-4xl font-extrabold mb-4 leading-tight tracking-tight text-white">
                Official Home of <span className="text-blue-500">Haryanvi Music.</span>
              </h1>
              <p className="text-sm text-slate-300 mb-8 max-w-md leading-relaxed">
                Create your account today to stream exclusive music video releases, audio tracks, and studio productions.
              </p>
              
              <ul className="space-y-4">
                {benefits.map((benefit, i) => (
                  <li key={i} className="flex items-center text-slate-200 text-xs font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 mr-3 shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="text-[11px] text-slate-400 relative z-10 pt-8 border-t border-slate-800/80 font-mono">
            Pure Desi Music (OPC) Private Limited &bull; CIN: U92490HR2020OPC091236
          </div>
        </div>

        {/* Right Panel - Register Form Container */}
        <div className="w-full lg:w-1/2 p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
          <div>
            <div className="lg:hidden flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
              <Link href="/" className="flex items-center space-x-2.5">
                <div className="bg-blue-600 p-2 rounded-lg text-white shadow-sm">
                  <Music className="h-5 w-5 font-bold" />
                </div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">{APP.NAME}</span>
              </Link>
              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200/60 dark:border-emerald-900">
                <ShieldCheck className="h-3.5 w-3.5" /> Fast Verification
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1.5">
                Create Free Account
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Enter your details to register for official Musica streaming.
              </p>
            </div>
            
            <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>}>
              <RegisterForm />
            </Suspense>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                Sign in instead
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
