"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-7xl">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-accent/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000" />
      </div>

      <div className="container mx-auto px-4 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20">
            Premium Haryanvi Music & Entertainment Platform
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
            Experience the Best of Entertainment. <br className="hidden md:block" />
            <span className="gradient-text">Stream Popular Hits.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Discover exclusive music videos, web series, and blockbuster entertainment directly from top creators. Your ultimate destination for Pure Desi Haryanvi content.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className={buttonVariants({ size: "lg", className: "w-full sm:w-auto text-lg h-14 px-8 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all" })}>
              Join Now <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <a href="https://www.youtube.com/@puredesiharyanvi" target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "lg", className: "w-full sm:w-auto text-lg h-14 px-8 rounded-full border-border/60 hover:bg-muted/50 backdrop-blur-sm" })}>
              <PlayCircle className="mr-2 h-5 w-5" /> Watch on YouTube
            </a>
          </div>
          
          <p className="mt-6 text-sm text-muted-foreground">
            Exclusive Content • High Quality • Pure Entertainment
          </p>
        </motion.div>
      </div>
    </section>
  );
}
