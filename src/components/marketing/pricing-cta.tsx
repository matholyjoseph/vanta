import React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PricingCta() {
  return (
    <section className="py-24 relative overflow-hidden bg-background">
      {/* Subtle radial gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/5 via-background to-background pointer-events-none" aria-hidden="true" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
            Ready to redefine video creation?
          </h2>
          <p className="text-lg md:text-xl text-muted mb-10 leading-relaxed max-w-2xl">
            Join thousands of professional creators utilizing Vanta AI to push the boundaries of cinematic storytelling.
          </p>
          
          <Button 
            asChild 
            size="lg" 
            className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-8 py-6 text-lg font-semibold group transition-all"
          >
            <Link href="/auth?mode=signup">
              Open Studio
              <ExternalLink className="ml-2 w-5 h-5 opacity-80 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
