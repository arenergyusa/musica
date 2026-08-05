import { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { GenreGrid } from "@/components/sections/GenreGrid";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { WhyMusica } from "@/components/sections/WhyMusica";
import { FaqSection } from "@/components/sections/FaqSection";
import { CtaBanner } from "@/components/sections/CtaBanner";

export const metadata: Metadata = {
  title: "Musica — Official Haryanvi Music Streaming & Video Platform",
  description: "Official Musica streaming hub. Discover trending Haryanvi music videos, audio releases, and studio tracks.",
  keywords: [
    "Musica",
    "Musica Streaming",
    "Musica Haryanvi",
    "Musica Songs",
    "Musica Music Videos",
    "Haryanvi Music Videos",
  ],
  openGraph: {
    title: "Musica — Official Haryanvi Music Videos & Audio Hub",
    description: "Watch latest Haryanvi music videos & official song releases on Musica.",
    url: "https://the-musica.com",
    siteName: "Musica",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Musica — Haryanvi Music Streaming Hub",
    description: "Stream trending Haryanvi music videos & official song releases on Musica.",
  },
  alternates: {
    canonical: "https://the-musica.com",
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Musica",
    "alternateName": ["Musica Streaming", "Musica Haryanvi", "The Musica", "Musica Music"],
    "url": "https://the-musica.com",
    "description": "Official Haryanvi Music Video Streaming Platform.",
    "publisher": {
      "@type": "Organization",
      "name": "Musica",
      "url": "https://the-musica.com",
      "logo": "https://the-musica.com/icon.png"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Musica",
    "alternateName": "Musica Streaming",
    "url": "https://the-musica.com",
    "identifier": {
      "@type": "PropertyValue",
      "name": "CIN",
      "value": "U92490HR2020OPC091236"
    },
    "taxID": "AALCP6210F",
    "email": "hello@themusica.in",
    "sameAs": [
    ]
  }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] dark:bg-[#0B0F19]">
      {/* Structured SEO Schema for Musica Search Ranking */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main id="main-content" className="flex-grow">
        <HeroSection />
        <GenreGrid />
        <HowItWorks />
        <WhyMusica />
        <FaqSection />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}
