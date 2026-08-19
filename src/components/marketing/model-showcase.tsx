import { MODELS } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getModelStudioUrl } from '@/lib/model-routing';

export default function ModelShowcase() {
  return (
    <section id="models" aria-label="Generation Models Showcase" className="w-full py-16 md:py-24 lg:py-32 bg-background border-t border-border">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-foreground">
            Generation Models
          </h2>
          <p className="max-w-[700px] text-muted-foreground md:text-xl">
            Choose the right engine for every creative challenge.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {MODELS.map((model, index) => {
            const studioUrl = getModelStudioUrl({ id: model.id, name: model.name, mediaType: "VIDEO" });

            return (
              <div
                key={model.name || index}
                className="group flex flex-col gap-6 rounded-2xl border border-border bg-surface p-6 sm:p-8 transition-all hover:border-accent/30 shadow-xl"
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-2xl font-bold text-foreground tracking-tight">{model.name}</h3>
                  {model.badge && (
                    <Badge variant="outline" className="text-accent border-accent/20 bg-accent/5 font-medium">
                      {model.badge}
                    </Badge>
                  )}
                </div>
                
                <p className="text-muted-foreground text-sm leading-relaxed min-h-[40px]">
                  {model.description}
                </p>
                
                <div className="mt-2 flex flex-wrap gap-6 font-mono text-xs text-muted-foreground bg-black/20 p-4 rounded-xl border border-border/50">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-white/40 uppercase tracking-wider text-[10px]">Resolution</span>
                    <span className="text-foreground font-medium">{model.resolution || 'Up to 4K'}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-white/40 uppercase tracking-wider text-[10px]">FPS</span>
                    <span className="text-foreground font-medium">{model.fps || '24/30/60'}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-white/40 uppercase tracking-wider text-[10px]">Duration</span>
                    <span className="text-foreground font-medium">{model.duration || 'Up to 60s'}</span>
                  </div>
                </div>
                
                <div className="mt-auto pt-6 border-t border-border/50 flex items-center justify-between">
                  <Link 
                    href={studioUrl}
                    className="inline-flex items-center text-sm font-bold text-accent hover:text-accent/80 transition-colors"
                  >
                    Try Model <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>

                  <Link
                    href={`/models/${model.id}`}
                    className="text-xs font-mono text-muted hover:text-foreground"
                  >
                    Model Specs →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
