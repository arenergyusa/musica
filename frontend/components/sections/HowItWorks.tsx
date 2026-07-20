"use client";

import { motion } from "framer-motion";
import { UserCheck, Clapperboard, Heart } from "lucide-react";

const steps = [
  {
    id: 1,
    title: "Create an Account",
    description: "Sign up quickly to get personalized recommendations and unlock exclusive Haryanvi content.",
    icon: UserCheck,
  },
  {
    id: 2,
    title: "Watch & Enjoy",
    description: "Dive into a vast library of Pure Desi Haryanvi music videos, web series, and exclusive releases.",
    icon: Clapperboard,
  },
  {
    id: 3,
    title: "Share with Friends",
    description: "Spread the joy of pure entertainment. Share your favorite hits with friends and family.",
    icon: Heart,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How Musica Works</h2>
          <p className="text-lg text-muted-foreground">
            A simple, transparent, and secure way to participate in the booming Indian entertainment industry.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2 z-0" />

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="relative z-10 flex flex-col items-center text-center group"
              >
                <div className="w-20 h-20 bg-background border-2 border-primary/30 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-primary/5 group-hover:border-primary transition-colors duration-300">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <div className="bg-card p-6 rounded-xl border border-border/50 shadow-sm w-full h-full">
                  <div className="text-xs font-bold text-primary mb-2 tracking-wider">STEP {step.id}</div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
