import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { WhyMusica } from "@/components/sections/WhyMusica";
import { VideoShowcase } from "@/components/sections/VideoShowcase";
import { FaqSection } from "@/components/sections/FaqSection";
import { CtaBanner } from "@/components/sections/CtaBanner";

// Metadata is already handled in layout.tsx as default, 
// but we can override it here if needed.

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main id="main-content" className="flex-grow">
        <HeroSection />
        <VideoShowcase />
        <HowItWorks />
        <WhyMusica />
        <FaqSection />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}
