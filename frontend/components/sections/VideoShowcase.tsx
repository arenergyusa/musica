"use client";

import { motion } from "framer-motion";
import { Play, Flame, Tv } from "lucide-react";

export function VideoShowcase() {
  return (
    <section id="trending-videos" className="py-20 bg-[#F8F9FA] dark:bg-[#0B0F19]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 text-xs font-bold mb-3 border border-red-200/60 dark:border-red-900">
            <Flame className="h-3.5 w-3.5" />
            <span>Trending Showcase</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-3">
            Popular Hits on <span className="text-blue-600 dark:text-blue-400">Pure Desi Haryanvi</span>
          </h2>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400">
            Watch chart-busting Haryanvi music videos directly from our official production house.
          </p>
        </div>

        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-4xl aspect-video rounded-lg overflow-hidden shadow-md border border-slate-200/80 dark:border-slate-800 bg-black relative"
          >
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/CZ33NyoOzAs?autoplay=0" 
              title="Chat purani Badnaam Shayar (Padh ke NeTeri ChatPurani) feat. Satya Sahu"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </motion.div>
        </div>
        
        <div className="mt-8 text-center">
          <a 
            href="https://www.youtube.com/@puredesiharyanvi" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center justify-center rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white h-11 px-6 shadow-sm transition-all"
          >
            <Tv className="mr-2 h-4 w-4" /> Subscribe on YouTube Channel
          </a>
        </div>
      </div>
    </section>
  );
}
