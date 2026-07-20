/* eslint-disable */
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CtaBanner() {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-primary/10"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-background to-accent/20"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="glass-card max-w-5xl mx-auto p-10 md:p-16 text-center rounded-3xl border-primary/20">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 tracking-tight">
            Ready to power the next big hit?
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join thousands of smart investors earning daily passive income through our transparent RBF model.
          </p>
          <Link href="/register" className={buttonVariants({ size: "lg", className: "h-14 px-10 text-lg rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all" })}>
            Create Your Account Now <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <p className="mt-6 text-sm text-muted-foreground">
            Takes less than 2 minutes • Secure & Encrypted
          </p>
        </div>
      </div>
    </section>
  );
}
