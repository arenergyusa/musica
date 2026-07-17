import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { StatsBar } from "@/components/sections/StatsBar";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { PlansSection } from "@/components/sections/PlansSection";
import { IncomeTypesSection } from "@/components/sections/IncomeTypesSection";
import { LevelIncomeTable } from "@/components/sections/LevelIncomeTable";
import { WhyMusica } from "@/components/sections/WhyMusica";
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
        <StatsBar />
        <HowItWorks />
        <PlansSection />
        <IncomeTypesSection />
        <LevelIncomeTable />
        <WhyMusica />
        <FaqSection />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}
