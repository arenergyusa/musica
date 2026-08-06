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
  title: "Musica — Community Rewards & Income Platform",
  description: "Official Musica platform. Earn daily rewards, level income, and monthly salary through sponsorships and team building.",
  keywords: [
    "Musica",
    "Musica Rewards",
    "Musica Income",
    "Musica Sponsorships",
    "Community Rewards",
    "Level Income",
  ],
  openGraph: {
    title: "Musica — Community Rewards & Income Platform",
    description: "Earn daily rewards, level income, and monthly salary by building your Musica team.",
    url: "https://the-musica.com",
    siteName: "Musica",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Musica — Community Rewards",
    description: "Earn daily rewards, level income, and monthly salary with Musica.",
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
    "alternateName": ["Musica Rewards", "Musica Income", "The Musica", "Musica Community"],
    "url": "https://the-musica.com",
    "description": "Musica is a community rewards and income platform.",
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
    "alternateName": "Musica Community Rewards",
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
