"use client";

import { motion } from "framer-motion";
import { UserCheck, Clapperboard, Share2 } from "lucide-react";

const steps = [
  {
    id: 1,
    title: "1. Create a Free Account",
    description: "Sign up in seconds to access curated Haryanvi music video feeds and custom playlists.",
    icon: UserCheck,
  },
  {
    id: 2,
    title: "2. Choose Music Category",
    description: "Select from DJ dance beats, romantic melodies, traditional folk, or studio recording specials.",
    icon: Clapperboard,
  },
  {
    id: 3,
    title: "3. Watch & Share Videos",
    description: "Stream high-definition music videos on any desktop or mobile screen and share tracks with friends.",
    icon: Share2,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 bg-[#F8F9FA] dark:bg-[#0B0F19]">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-3">
            How Music Streaming <span className="text-blue-600 dark:text-blue-400">Works</span>
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Fast and easy access to official Haryanvi music video content.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative max-w-5xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.15 }}
                className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center mb-5 border border-blue-100 dark:border-blue-900">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{step.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
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
