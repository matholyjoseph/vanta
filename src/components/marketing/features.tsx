import { FEATURES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function Features() {
  return (
    <section id="features" aria-label="Features Section" className="w-full py-16 md:py-24 lg:py-32 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-foreground">
            Precision Engineering for Creators
          </h2>
          <p className="max-w-[700px] text-muted-foreground md:text-xl">
            Everything you need to orchestrate complex video generations from a single, powerful workspace.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 max-w-5xl mx-auto">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            const isDirectorMode = feature.title === 'AI Director Mode' || index === FEATURES.length - 1;

            return (
              <div
                key={feature.title || index}
                className={cn(
                  "group relative overflow-hidden rounded-2xl bg-surface border border-border p-6 sm:p-8 transition-colors hover:border-accent/30 flex flex-col gap-5",
                  isDirectorMode && "md:col-span-2"
                )}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-hover group-hover:bg-accent/10 transition-colors">
                  {Icon && <Icon className="h-6 w-6 text-foreground group-hover:text-accent transition-colors" />}
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-foreground tracking-tight">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
