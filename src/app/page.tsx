import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import Hero from "@/components/marketing/hero";
import ModelTabs from "@/components/marketing/model-tabs";
import Features from "@/components/marketing/features";
import ModelShowcase from "@/components/marketing/model-showcase";
import Gallery from "@/components/marketing/gallery";
import HowItWorks from "@/components/marketing/how-it-works";
import Testimonials from "@/components/marketing/testimonials";
import PricingCta from "@/components/marketing/pricing-cta";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen w-full flex flex-col bg-background text-foreground overflow-y-auto">
      <Navbar />
      <main id="main-content" className="flex-1 w-full">
        <Hero />
        <ModelTabs />
        <Features />
        <ModelShowcase />
        <Gallery />
        <HowItWorks />
        <Testimonials />
        <PricingCta />
      </main>
      <Footer />
    </div>
  );
}
