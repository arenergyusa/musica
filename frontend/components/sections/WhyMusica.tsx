"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Video, Headphones, Disc, Sparkles } from "lucide-react";

const features = [
  "High-Definition Video Playback",
  "Official Studio Recording Releases",
  "Direct Artist Song Premieres",
  "Crisp High-Fidelity Audio Tracks",
  "Desktop & Mobile Responsive Player",
  "Curated Music Playlists",
];

export function WhyMusica() {
  return (
    <section className="py-16 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <div className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold mb-3 border border-blue-200/60 dark:border-blue-900">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Music Experience</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
              Why Watch on <span className="text-blue-600 dark:text-blue-400">Musica?</span>
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              Musica provides a dedicated platform for official Haryanvi music videos. Enjoy high-definition video playback, crisp studio audio, and exclusive artist song premieres.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="relative rounded-lg overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-[#F8F9FA] dark:bg-slate-800/60 p-6 shadow-sm"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <div className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-950/60 rounded-lg">
                  <Video className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">High-Definition Playback</h4>
                  <p className="text-xs text-slate-500">Stream smooth, high-quality music video releases.</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 rounded-lg">
                  <Headphones className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Studio Sound Quality</h4>
                  <p className="text-xs text-slate-500">Clear audio output for every beat and instrument track.</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <div className="p-3 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 rounded-lg">
                  <Disc className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Exclusive Song Premieres</h4>
                  <p className="text-xs text-slate-500">Discover new Haryanvi music video releases first.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
