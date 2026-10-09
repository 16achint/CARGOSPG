import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { ShipmentCoreSection } from "@/components/landing/ShipmentCoreSection";
import { ModesSection } from "@/components/landing/ModesSection";
import { ProductPreviewSection } from "@/components/landing/ProductPreviewSection";
import { ControlTowerSection } from "@/components/landing/ControlTowerSection";
import { DocumentSection } from "@/components/landing/DocumentSection";
import { FinanceSection } from "@/components/landing/FinanceSection";
import { ParticipantsSection } from "@/components/landing/ParticipantsSection";
import { ValueSection } from "@/components/landing/ValueSection";
import { WorkflowSection } from "@/components/landing/WorkflowSection";
import { OperationsCapabilitiesSection } from "@/components/landing/OperationsCapabilitiesSection";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="relative">
      <a href="#main" onClick={(e) => { e.preventDefault(); document.getElementById("platform")?.focus(); document.getElementById("platform")?.scrollIntoView(); }} className="sr-only z-[60] rounded-lg bg-signal-500 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>
      <LandingHeader />
      <main id="main">
        <HeroSection />
        <ShipmentCoreSection />
        <WorkflowSection />
        <OperationsCapabilitiesSection />
        <ModesSection />
        <ProductPreviewSection />
        <ControlTowerSection />
        {/* Continuous ambient band behind document + finance */}
        <div className="relative">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(231,238,246,0.7)_30%,rgba(231,238,246,0.7)_70%,transparent)]" />
          <DocumentSection />
          <FinanceSection />
        </div>
        <ParticipantsSection />
        <ValueSection />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
