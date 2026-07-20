"use client";

import { motion } from "framer-motion";
import { Users, TrendingUp, ShieldCheck } from "lucide-react";

const stats = [
  {
    id: 1,
    title: "Active Investors",
    value: "10,000+",
    icon: Users,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    id: 2,
    title: "Total Invested",
    value: "₹50 Cr+",
    icon: TrendingUp,
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    id: 3,
    title: "Default Rate",
    value: "0%",
    icon: ShieldCheck,
    color: "text-primary",
    bg: "bg-primary/10",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function StatsBar() {
  return (
    <section className="py-10 relative z-20 -mt-10 mb-10">
      <div className="container mx-auto px-4">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.id}
                variants={item}
                className="glass-card p-8 flex items-center justify-between group"
              >
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {stat.title}
                  </p>
                  <h3 className="text-3xl font-bold text-foreground">
                    {stat.value}
                  </h3>
                </div>
                <div className={`p-4 rounded-full ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-8 w-8" />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
