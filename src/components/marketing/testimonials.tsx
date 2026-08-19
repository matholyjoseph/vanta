import React from 'react';
import { Quote } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { TESTIMONIALS } from '@/lib/constants';

export default function Testimonials() {
  return (
    <section className="py-20 lg:py-28 bg-surface/30 border-y border-border overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
            What Creators Are Saying
          </h2>
        </div>

        <div className="flex overflow-x-auto md:grid md:grid-cols-3 gap-6 pb-8 md:pb-0 snap-x snap-mandatory">
          {TESTIMONIALS.map((testimonial, index) => (
            <article 
              key={index}
              className="flex-shrink-0 w-[85vw] md:w-auto snap-center bg-surface border border-border rounded-2xl p-8 relative flex flex-col justify-between"
            >
              <div className="absolute top-6 right-6 opacity-10">
                <Quote className="w-16 h-16 text-accent" />
              </div>
              
              <div className="relative z-10 mb-8">
                <p className="text-lg text-foreground leading-relaxed italic">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
              </div>

              <div>
                <Separator className="mb-6 bg-border" />
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-background border border-border flex items-center justify-center flex-shrink-0">
                    <span className="text-muted font-bold text-sm">
                      {testimonial.author.split(' ').map((n: string) => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-foreground">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-muted">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
