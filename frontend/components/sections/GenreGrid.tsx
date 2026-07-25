"use client";

import { motion } from "framer-motion";
import { Music, Disc, Mic2, Radio, Sparkles, ChevronRight } from "lucide-react";
import Link from "next/link";

const GENRES = [
  {
    id: "haryanvi-hits",
    title: "DJ Dance Hits & Beats",
    count: "250+ Videos",
    description: "High-energy Haryanvi DJ dance tracks and energetic music video releases.",
    icon: Music,
    badge: "Trending Hits",
    color: "from-blue-600 to-indigo-600",
  },
  {
    id: "romantic-melodies",
    title: "Romantic & Melody Songs",
    count: "150+ Videos",
    description: "Soulful Haryanvi romantic music videos produced by top studio artists.",
    icon: Disc,
    badge: "Top Charted",
    color: "from-emerald-600 to-teal-600",
  },
  {
    id: "artist-originals",
    title: "Artist Studio Specials",
    count: "100+ Recordings",
    description: "Official studio recording sessions and exclusive artist performance releases.",
    icon: Mic2,
    badge: "Studio Originals",
    color: "from-indigo-600 to-purple-600",
  },
  {
    id: "folk-heritage",
    title: "Folk & Cultural Tracks",
    count: "180+ Videos",
    description: "Authentic Haryanvi cultural music videos and traditional heritage songs.",
    icon: Radio,
    badge: "Folk Classics",
    color: "from-amber-600 to-orange-600",
  },
];

export function GenreGrid() {
  return (
    <section className="py-16 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800">
      <div className="container mx-auto px-4">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold mb-3 border border-blue-200/60 dark:border-blue-900">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Music Categories</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3">
            Explore Popular <span className="text-blue-600 dark:text-blue-400">Music Video Genres</span>
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg mx-auto">
            Discover a curated collection of official Haryanvi music videos tailored for every playlist.
          </p>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {GENRES.map((genre, idx) => {
            const Icon = genre.icon;
            return (
              <motion.div
                key={genre.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="group relative bg-[#F8F9FA] dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 rounded-lg p-5 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${genre.color} text-white shadow-sm`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-100 dark:border-blue-900">
                      {genre.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 group-hover:text-blue-600 transition-colors">
                    {genre.title}
                  </h3>
                  
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                    {genre.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-400 text-[11px] font-mono">{genre.count}</span>
                  <Link href="/register" className="inline-flex items-center font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 group-hover:translate-x-0.5 transition-all">
                    Browse Category <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
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
