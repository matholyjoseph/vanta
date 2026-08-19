import React from 'react';
import { ArrowRight, Wand2, Video, Rocket } from 'lucide-react';
import { HOW_IT_WORKS_STEPS } from '@/lib/constants';

// Mapping step icons based on their index or a known type
const ICON_MAP: Record<number, React.ElementType> = {
  0: Wand2,
  1: Video,
  2: Rocket,
};

export default function HowItWorks() {
  return (
    <section className="py-20 lg:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
            How It Works
          </h2>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4 relative">
          {HOW_IT_WORKS_STEPS.map((step, index) => {
            const Icon = ICON_MAP[index] || Wand2;
            
            return (
              <React.Fragment key={index}>
                <div className="flex-1 flex flex-col items-center text-center max-w-sm w-full z-10 relative">
                  <div className="w-20 h-20 rounded-full bg-surface border border-border flex items-center justify-center mb-6 relative shadow-lg">
                    <Icon className="w-8 h-8 text-foreground" aria-hidden="true" />
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent text-accent-foreground font-bold flex items-center justify-center border-4 border-background">
                      {index + 1}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {index < HOW_IT_WORKS_STEPS.length - 1 && (
                  <div className="hidden md:flex flex-shrink-0 items-center justify-center px-4" aria-hidden="true">
                    <ArrowRight className="w-8 h-8 text-muted opacity-50" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
}
