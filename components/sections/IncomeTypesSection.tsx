"use client";

import { motion } from "framer-motion";
import { Wallet, Network, TrendingUp } from "lucide-react";

const incomes = [
  {
    id: "roi",
    title: "Daily ROI",
    description: "Earn 10% monthly (0.3333% daily) on your active investment. This is fixed and paid out every single day until your cap is reached.",
    icon: Wallet,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    id: "referral",
    title: "Direct Referral Reward",
    description: "Get a one-time reward when you directly invite someone to invest. Earn 4% on Level 1, 1% on Level 2, and 1% on Level 3 investments.",
    icon: Network,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    id: "level",
    title: "Level Income",
    description: "Build a team and earn daily! Get a percentage of your downline's daily ROI every day, up to 15 levels deep (based on your team volume).",
    icon: TrendingUp,
    color: "text-accent",
    bg: "bg-accent/10",
  },
];

export function IncomeTypesSection() {
  return (
    <section id="income" className="py-24 bg-card border-y border-border/40">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">3 Ways to Earn</h2>
          <p className="text-lg text-muted-foreground">
            Whether you're a passive investor or an active team builder, our reward structure is designed to maximize your earnings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {incomes.map((income, index) => {
            const Icon = income.icon;
            return (
              <motion.div
                key={income.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-background rounded-2xl p-8 border border-border/50 shadow-sm hover:shadow-lg transition-all"
              >
                <div className={`w-14 h-14 rounded-xl ${income.bg} ${income.color} flex items-center justify-center mb-6`}>
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{income.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {income.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
