'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function ModelTabs() {
  const models = ['Nova Video Pro', 'Motion X', 'Curator', 'Flash Video'];
  const [activeTab, setActiveTab] = useState(models[0]);

  return (
    <section aria-label="Generation Models Tabs" className="w-full py-8 border-y border-border bg-surface/50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-6">
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Trusted Generation Models
          </h2>
          <div className="w-full overflow-x-auto pb-2 scrollbar-none">
            <div className="flex items-center justify-start sm:justify-center gap-8 min-w-max px-2">
              {models.map((model) => (
                <button
                  key={model}
                  onClick={() => setActiveTab(model)}
                  className={cn(
                    "relative pb-3 text-sm font-medium transition-colors hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm",
                    activeTab === model
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                  aria-selected={activeTab === model}
                  role="tab"
                >
                  {model}
                  {activeTab === model && (
                    <span className="absolute bottom-0 left-0 h-0.5 w-full bg-accent rounded-t-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
