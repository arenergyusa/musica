import Link from "next/link";
import { Music } from "lucide-react";
import { APP } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Forgot Password | ${APP.NAME}`,
  description: "Reset your password for your Musica RBF account.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex w-full">
      <div className="w-full flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-sm relative z-10">
          <div className="mb-8 flex justify-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-primary p-2 rounded-lg text-primary-foreground shadow-md shadow-primary/20">
                <Music className="h-5 w-5" />
              </div>
              <span className="font-bold text-xl tracking-tight">{APP.NAME}</span>
            </Link>
          </div>
          
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold mb-2">Forgot Password</h2>
            <p className="text-muted-foreground">
              Enter your email to reset your password.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="text-center p-6 bg-primary/5 rounded-lg border border-primary/20 space-y-3">
              <p className="text-sm font-medium text-foreground">
                Self-service password reset is currently unavailable for security reasons.
              </p>
              <p className="text-sm text-muted-foreground">
                Please contact your sponsor or the platform administrator to reset your password.
              </p>
            </div>
          </div>
          
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
