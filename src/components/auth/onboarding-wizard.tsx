"use client";

import * as React from "react";
import { Check, Sparkles, ArrowRight, Video, Film, Wand2, Monitor, Smartphone, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface OnboardingWizardProps {
  userId?: string;
  onComplete: () => void;
}

const CREATION_TYPES = [
  "Films",
  "YouTube Videos",
  "Social Media",
  "Advertising",
  "Music Videos",
  "Product Marketing",
  "Other",
];

const FIRST_CREATION_OPTIONS = [
  { id: "text-to-video", label: "Text to Video", desc: "Generate cinematic scenes from prompts" },
  { id: "image-to-video", label: "Image to Video", desc: "Animate still imagery into footage" },
  { id: "cinematic-scene", label: "Cinematic Scene", desc: "Multi-shot sequence narrative" },
  { id: "social-short", label: "Social Media Short", desc: "Vertical 9:16 engaging clips" },
  { id: "product-ad", label: "Product Advertisement", desc: "Commercial product renders" },
  { id: "explore-first", label: "Explore First", desc: "Browse templates and community feed" },
];

const ASPECT_RATIOS = [
  { id: "16:9", label: "16:9 Landscape", desc: "Widescreen cinema & YouTube", icon: Monitor },
  { id: "9:16", label: "9:16 Portrait", desc: "TikTok, Reels & Shorts", icon: Smartphone },
  { id: "1:1", label: "1:1 Square", desc: "Feed posts & carousels", icon: Square },
];

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = React.useState(1);
  const [selectedTypes, setSelectedTypes] = React.useState<string[]>(["Films"]);
  const [firstCreation, setFirstCreation] = React.useState("text-to-video");
  const [aspectRatio, setAspectRatio] = React.useState("16:9");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      await fetch("/api/user/preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorType: selectedTypes.join(", "),
          aspectRatio,
          onboardingCompleted: true,
        }),
      });
    } catch {
      // Fallback
    } finally {
      setIsSubmitting(false);
      onComplete();
    }
  };

  return (
    <div className="rounded-2xl border border-accent/40 bg-surface p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4">
        <Badge variant="outline" className="font-mono text-[10px] text-accent border-accent/30">
          STEP {step} OF 4
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-surface-hover rounded-full overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
              What do you create?
            </h2>
            <p className="text-xs text-muted">
              Select all options that apply to your workflow.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CREATION_TYPES.map((type) => {
              const isSelected = selectedTypes.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleType(type)}
                  className={`p-3.5 rounded-xl border text-xs font-semibold font-mono text-left transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border bg-background text-muted hover:border-accent/40 hover:text-foreground"
                  }`}
                >
                  <span>{type}</span>
                  {isSelected && <Check className="h-4 w-4 text-accent shrink-0" />}
                </button>
              );
            })}
          </div>

          <Button
            onClick={() => setStep(2)}
            disabled={selectedTypes.length === 0}
            className="w-full bg-accent text-accent-foreground hover:bg-accent-hover font-bold text-xs h-11"
          >
            Next Step <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
              What do you want to create first?
            </h2>
            <p className="text-xs text-muted">
              We&apos;ll optimize your studio workspace for your primary task.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FIRST_CREATION_OPTIONS.map((opt) => {
              const isSelected = firstCreation === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFirstCreation(opt.id)}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                    isSelected
                      ? "border-accent bg-accent/10 text-foreground"
                      : "border-border bg-background text-muted hover:border-accent/40"
                  }`}
                >
                  <div className="font-bold text-xs flex items-center justify-between text-foreground">
                    <span>{opt.label}</span>
                    {isSelected && <Check className="h-4 w-4 text-accent shrink-0" />}
                  </div>
                  <div className="text-[11px] text-muted">{opt.desc}</div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="w-1/3 text-xs border-border"
            >
              Back
            </Button>
            <Button
              onClick={() => setStep(3)}
              className="w-2/3 bg-accent text-accent-foreground hover:bg-accent-hover font-bold text-xs h-11"
            >
              Next Step <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
              Preferred aspect ratio
            </h2>
            <p className="text-xs text-muted">
              Set your default frame canvas geometry.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {ASPECT_RATIOS.map((ratio) => {
              const Icon = ratio.icon;
              const isSelected = aspectRatio === ratio.id;
              return (
                <button
                  key={ratio.id}
                  type="button"
                  onClick={() => setAspectRatio(ratio.id)}
                  className={`p-5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? "border-accent bg-accent/10 text-foreground"
                      : "border-border bg-background text-muted hover:border-accent/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className={`h-6 w-6 ${isSelected ? "text-accent" : "text-muted"}`} />
                    {isSelected && <Check className="h-4 w-4 text-accent" />}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-foreground font-mono">{ratio.label}</div>
                    <div className="text-[10px] text-muted">{ratio.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(2)}
              className="w-1/3 text-xs border-border"
            >
              Back
            </Button>
            <Button
              onClick={() => setStep(4)}
              className="w-2/3 bg-accent text-accent-foreground hover:bg-accent-hover font-bold text-xs h-11"
            >
              Next Step <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4 */}
      {step === 4 && (
        <div className="space-y-6 text-center py-4">
          <div className="w-16 h-16 rounded-full bg-accent/20 text-accent flex items-center justify-center mx-auto shadow-lg">
            <Sparkles className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
              You&apos;re All Set!
            </h2>
            <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
              Your Vanta AI Studio workspace is configured with 100 free generation credits and commercial licensing.
            </p>
          </div>

          <Button
            onClick={handleFinish}
            disabled={isSubmitting}
            className="w-full bg-accent text-accent-foreground hover:bg-accent-hover font-bold text-sm h-12 shadow-xl cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entering Workspace...
              </>
            ) : (
              <>
                Enter VANTA AI <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
