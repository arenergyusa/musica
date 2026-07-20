"use client";

import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

const features = [
  "Premium high-quality music videos",
  "Exclusive web series and short films",
  "Direct support for local artists and creators",
  "Cultural preservation of Haryanvi traditions",
  "Seamless streaming experience",
  "Curated playlists for every mood",
];

export function WhyMusica() {
  return (
    <section className="py-24 bg-card">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Why Choose <span className="text-primary">Musica?</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Musica is your ultimate destination for everything Haryanvi. From the latest chart-topping music videos to compelling web series, we bring the best of regional entertainment directly to your screens. Experience the vibrant culture and storytelling of Haryana like never before.
            </p>
            
            <ul className="space-y-4">
              {features.map((feature, idx) => (
                <li key={idx} className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-accent mr-3 shrink-0" />
                  <span className="font-medium">{feature}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative h-[400px] w-full lg:h-[500px] rounded-2xl overflow-hidden border border-border/50 shadow-2xl shadow-primary/10"
          >
            {/* Placeholder for actual image - using a stylized div for now */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-background to-accent/20 flex items-center justify-center">
              <div className="text-center p-8 glass-card">
                <h3 className="text-2xl font-bold mb-2">Music & Cinema</h3>
                <p className="text-muted-foreground">Powering the next generation of blockbusters</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
