/* eslint-disable */
import Link from "next/link";
import { Music, CheckCircle2 } from "lucide-react";
import { APP } from "@/lib/constants";
import { LoginForm } from "@/components/forms/LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Login | ${APP.NAME}`,
  description: "Log in to your Musica RBF investment account.",
};

const benefits = [
  "Track your daily ROI payouts",
  "Manage active investments",
  "Monitor your team downline",
  "Seamless one-click withdrawals"
];

export default function LoginPage() {
  return (
    <div className="min-h-screen flex w-full">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-1/2 bg-primary/5 flex-col justify-between p-12 border-r border-border/40 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
           <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" />
           <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000" />
        </div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center space-x-2 w-fit">
            <div className="bg-primary p-2 rounded-xl text-primary-foreground shadow-lg shadow-primary/20">
              <Music className="h-6 w-6" />
            </div>
            <span className="font-bold text-2xl tracking-tight">{APP.NAME}</span>
          </Link>
          
          <div className="mt-28">
            <h1 className="text-4xl xl:text-5xl font-extrabold mb-6 leading-tight">
              Welcome back to <span className="text-primary">Musica.</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-10 max-w-md leading-relaxed">
              Log in to your dashboard to monitor your RBF pool contributions and manage your revenue share credits.
            </p>
            
            <ul className="space-y-5">
              {benefits.map((benefit, i) => (
                <li key={i} className="flex items-center text-foreground font-medium">
                  <CheckCircle2 className="h-5 w-5 text-accent mr-3 shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground relative z-10">
          © {new Date().getFullYear()} {APP.NAME}. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-sm relative z-10">
          <div className="mb-8 lg:hidden flex justify-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-primary p-2 rounded-lg text-primary-foreground shadow-md shadow-primary/20">
                <Music className="h-5 w-5" />
              </div>
              <span className="font-bold text-xl tracking-tight">{APP.NAME}</span>
            </Link>
          </div>
          
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-bold mb-2">Log in</h2>
            <p className="text-muted-foreground">
              Welcome back! Please enter your details.
            </p>
          </div>
          
          <LoginForm />
          
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              Register now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
