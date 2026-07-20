import Link from "next/link";
import { Music, CheckCircle2 } from "lucide-react";
import { APP } from "@/lib/constants";
import { RegisterForm } from "@/components/forms/RegisterForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Register | ${APP.NAME}`,
  description: "Create an account to start your RBF investment journey.",
};

const benefits = [
  "Revenue sharing up to 3x of your contribution",
  "Transparent RBF pool structure",
  "Automated daily wallet credits",
  "No equity dilution for creators"
];

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex w-full bg-background relative selection:bg-primary/30">
      {/* Abstract Background for the whole page on mobile */}
      <div className="absolute inset-0 z-0 lg:hidden overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-96 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
      </div>

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-1/2 bg-zinc-950 flex-col justify-between p-12 relative overflow-hidden text-zinc-50 border-r border-white/10">
        {/* Background blobs & gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/20 via-zinc-950 to-zinc-950" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-screen filter blur-[100px] opacity-70 animate-blob" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full mix-blend-screen filter blur-[100px] opacity-70 animate-blob animation-delay-2000" />
        </div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center space-x-3 w-fit group">
            <div className="bg-primary/20 p-2.5 rounded-xl text-primary border border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.3)] transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(var(--primary),0.5)]">
              <Music className="h-6 w-6" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400">
              {APP.NAME}
            </span>
          </Link>
          
          <div className="mt-32">
            <h1 className="text-4xl xl:text-5xl font-black mb-6 leading-tight tracking-tight">
              Invest in the future of <br/>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
                Indian Cinema.
              </span>
            </h1>
            <p className="text-lg text-zinc-400 mb-10 max-w-md leading-relaxed font-medium">
              Join India&apos;s premier RBF platform. Fund top entertainment productions and receive revenue share credits directly to your wallet.
            </p>
            
            <ul className="space-y-5">
              {benefits.map((benefit, i) => (
                <li key={i} className="flex items-center text-zinc-300 font-medium group">
                  <div className="mr-4 rounded-full p-1 bg-white/5 border border-white/10 group-hover:bg-primary/20 group-hover:border-primary/30 group-hover:text-primary transition-colors">
                    <CheckCircle2 className="h-4 w-4 text-zinc-400 group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-sm md:text-base">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="text-sm text-zinc-500 relative z-10 font-medium">
          © {new Date().getFullYear()} {APP.NAME}. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12 relative z-10">
        <div className="w-full max-w-md relative">
          
          <div className="mb-10 lg:hidden flex justify-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="bg-primary/10 p-2.5 rounded-xl text-primary border border-primary/20 shadow-md">
                <Music className="h-6 w-6" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight">{APP.NAME}</span>
            </Link>
          </div>
          
          <div className="bg-card/50 backdrop-blur-xl sm:border border-border/50 sm:shadow-2xl sm:shadow-black/5 rounded-3xl p-6 sm:p-10">
            <div className="mb-8 text-center lg:text-left">
              <h2 className="text-3xl font-extrabold mb-2 tracking-tight">Create an account</h2>
              <p className="text-muted-foreground font-medium">
                Enter your details below to get started.
              </p>
            </div>
            
            <RegisterForm />
            
            <p className="mt-8 text-center text-sm text-muted-foreground font-medium">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-bold hover:underline hover:text-primary/80 transition-colors">
                Log in instead
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
