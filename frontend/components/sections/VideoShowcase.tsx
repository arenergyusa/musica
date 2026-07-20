/* eslint-disable */
"use client";

import { motion } from "framer-motion";

const videos = [
  {
    id: "vi_1",
    title: "Pure Desi Haryanvi Hits",
    url: "https://www.youtube.com/embed/videoseries?list=UULF5qK0J-M1Z3R_6O8bW89A", // This is a placeholder standard list format for channel uploads, actual video IDs might be better but this works as a generic showcase
  }
];

export function VideoShowcase() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Popular on Pure Desi Haryanvi</h2>
          <p className="text-lg text-muted-foreground">
            Watch the latest and most popular Haryanvi music videos directly from the creators.
          </p>
        </div>

        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-4xl aspect-video rounded-xl overflow-hidden shadow-2xl border border-border/50"
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
        
        <div className="mt-12 text-center">
          <a href="https://www.youtube.com/@puredesiharyanvi" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
            Subscribe to Channel
          </a>
        </div>
      </div>
    </section>
  );
}
