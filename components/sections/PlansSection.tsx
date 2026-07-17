"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { INVESTMENT_PLANS, CAP_MULTIPLIER } from "@/lib/constants";
import { formatINR } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";

export function PlansSection() {
  return (
    <section id="plans" className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Investment Plans</h2>
          <p className="text-lg text-muted-foreground">
            Choose a plan that fits your goals. Every plan offers fixed daily rewards and up to 3x total returns through our RBF structure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {INVESTMENT_PLANS.map((plan, index) => {
            const isPopular = plan.id === "gold";
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`relative flex flex-col h-full bg-card rounded-2xl border transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${
                  isPopular 
                    ? "border-primary shadow-primary/10 shadow-lg" 
                    : "border-border/50 hover:border-primary/50"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 inset-x-0 flex justify-center">
                    <Badge variant={isPopular ? "default" : "secondary"} className="uppercase text-[10px] tracking-wider font-bold px-3 py-1">
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <div className={`p-6 text-center border-b ${isPopular ? 'bg-primary/5' : ''} rounded-t-2xl`}>
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="text-3xl font-extrabold text-foreground mb-1">
                    {formatINR(plan.amount)}
                  </div>
                  <p className="text-sm text-muted-foreground">One-time Investment</p>
                </div>

                <div className="p-6 flex-grow flex flex-col">
                  <ul className="space-y-4 mb-8 flex-grow">
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-accent mr-3 shrink-0" />
                      <div className="text-sm">
                        <span className="font-semibold text-foreground">{formatINR(plan.dailyROI)}</span>
                        <span className="text-muted-foreground block text-xs">Daily Reward ({plan.dailyRatePct.toFixed(4)}%)</span>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-accent mr-3 shrink-0" />
                      <div className="text-sm">
                        <span className="font-semibold text-foreground">{plan.monthlyReturnPct}%</span>
                        <span className="text-muted-foreground block text-xs">Monthly Return</span>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-primary mr-3 shrink-0" />
                      <div className="text-sm">
                        <span className="font-semibold text-foreground">{CAP_MULTIPLIER.NON_WORKING}x</span>
                        <span className="text-muted-foreground block text-xs">Cap (Non-Working)</span>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-primary mr-3 shrink-0" />
                      <div className="text-sm">
                        <span className="font-semibold text-foreground">{CAP_MULTIPLIER.WORKING}x</span>
                        <span className="text-muted-foreground block text-xs">Cap (Working)</span>
                      </div>
                    </li>
                  </ul>

                  <Link href="/register" className={buttonVariants({ variant: isPopular ? "default" : "outline", className: `w-full ${isPopular ? '' : ''}` })}>
                    Invest Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
