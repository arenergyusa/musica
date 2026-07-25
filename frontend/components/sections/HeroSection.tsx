"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { PlayCircle, Flame, Tv, Sparkles, Music2, Film, Radio } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative pt-24 pb-16 md:pt-36 md:pb-24 bg-[#F8F9FA] dark:bg-[#0B0F19] overflow-hidden">
      {/* Background Glow Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
        <div className="absolute top-10 left-1/4 w-[450px] h-[450px] bg-blue-100/50 dark:bg-blue-900/20 rounded-full filter blur-3xl opacity-70" />
        <div className="absolute top-28 right-1/4 w-[400px] h-[400px] bg-emerald-100/40 dark:bg-emerald-950/20 rounded-full filter blur-3xl opacity-60" />
      </div>

      <div className="container mx-auto px-4 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-4xl mx-auto"
        >
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-5 leading-[1.15] text-slate-900 dark:text-white font-sans">
            Musica — Official Home of <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 bg-clip-text text-transparent">
              Haryanvi Music Videos &amp; Tracks
            </span>
          </h1>

          {/* Subtitle Copy */}
          <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-xl mx-auto leading-relaxed font-normal">
            Stream official Musica Haryanvi music videos, chart-topping song releases, and studio recordings in high definition.
          </p>

          {/* Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-10">
            <Link 
              href="/register" 
              className={buttonVariants({ 
                size: "lg", 
                className: "w-full sm:w-auto text-xs font-bold h-11 px-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all border border-blue-600" 
              })}
            >
              <Sparkles className="mr-2 h-4 w-4" /> Listen &amp; Watch Now
            </Link>
            <a 
              href="#trending-videos" 
              className={buttonVariants({ 
                variant: "outline", 
                size: "lg", 
                className: "w-full sm:w-auto text-xs font-semibold h-11 px-7 rounded-lg border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 shadow-sm" 
              })}
            >
              <PlayCircle className="mr-2 h-4 w-4 text-blue-600" /> Watch Featured Video
            </a>
          </div>

          {/* Clean Music Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto pt-6 border-t border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 py-2.5 px-3 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <Music2 className="h-4 w-4 text-blue-600" /> High-Definition Video
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 py-2.5 px-3 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <Sparkles className="h-4 w-4 text-emerald-500" /> Official Production Hits
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 py-2.5 px-3 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <Radio className="h-4 w-4 text-blue-600" /> Studio Sound Quality
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
