"use client";

import * as React from "react";
import { Sparkles, Wand2, ArrowUpRight, History, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { CreationSettings, AIModelData } from "@/components/studio/creation-settings";
import { GenerationCard, GenerationCardData } from "@/components/studio/generation-card";
import { DashboardGeneration } from "@/components/dashboard/dashboard-content";

interface StudioWorkspaceProps {
  initialGenerations?: DashboardGeneration[];
  selectedGenerationId?: string;
  onSelectGeneration?: (gen: any) => void;
}

export function StudioWorkspace({ initialGenerations = [] }: StudioWorkspaceProps) {
  const { showToast } = useToast();

  // Models State
  const [models, setModels] = React.useState<AIModelData[]>([]);
  const [selectedModelId, setSelectedModelId] = React.useState("vanta-motion-fast");

  // Input State
  const [prompt, setPrompt] = React.useState("");
  const [negativePrompt, setNegativePrompt] = React.useState("");
  const [mode, setMode] = React.useState("text-to-video");
  const [duration, setDuration] = React.useState("5s");
  const [resolution, setResolution] = React.useState("1080p");
  const [aspectRatio, setAspectRatio] = React.useState("16:9");
  const [audio, setAudio] = React.useState(false);
  const [cameraMotion, setCameraMotion] = React.useState({ pan: "static", zoom: "static", orbit: "static" });

  const [creditCost, setCreditCost] = React.useState(8);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // History Generations State
  const [generations, setGenerations] = React.useState<GenerationCardData[]>([]);
  const [selectedGenId, setSelectedGenId] = React.useState<string | null>(null);

  // Fetch Video Models on Mount & handle ?model= / ?referenceAssetId= query parameters
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const targetModelSlug = urlParams.get("model")?.toLowerCase().trim();
    const targetAssetId = urlParams.get("referenceAssetId");
    const targetMode = urlParams.get("mode");

    if (targetMode) {
      setMode(targetMode);
      if (targetMode === "text-to-video") {
        window.history.replaceState({}, "", "/studio/video?model=" + (targetModelSlug || "gemini-omni-flash") + "&mode=text-to-video");
      }
    }

    fetch("/api/models?type=VIDEO")
      .then((res) => res.json())
      .then((data) => {
        const availableModels: AIModelData[] = data.models || [];
        setModels(availableModels);

        if (targetModelSlug) {
          const match = availableModels.find(
            (m) => m.slug.toLowerCase() === targetModelSlug || m.id.toLowerCase() === targetModelSlug || m.name.toLowerCase().replace(/\s+/g, "-") === targetModelSlug
          );

          if (match && match.type === "VIDEO") {
            setSelectedModelId(match.slug);
          } else {
            showToast("That model is not available for video generation. Default video model selected.", "info");
            if (availableModels.length > 0) {
              setSelectedModelId(availableModels[0].slug);
            }
          }
        } else if (availableModels.length > 0) {
          setSelectedModelId(availableModels[0].slug);
        }
      })
      .catch(() => {});
  }, [showToast]);

  // Fetch Generations History on Mount
  React.useEffect(() => {
    fetch("/api/generations")
      .then((res) => res.json())
      .then((data) => {
        if (data.generations) {
          setGenerations(data.generations);
          if (data.generations.length > 0) {
            setSelectedGenId(data.generations[0].id);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Fetch Estimated Credit Cost on input change
  React.useEffect(() => {
    fetch(`/api/generation-cost?modelId=${selectedModelId}&duration=${duration}&resolution=${resolution}&audio=${audio}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.creditCost) setCreditCost(data.creditCost);
      })
      .catch(() => {});
  }, [selectedModelId, duration, resolution, audio]);

  // Subscribe to SSE updates for active/in-progress generations
  const subscribeToEvents = React.useCallback((genId: string) => {
    const eventSource = new EventSource(`/api/generations/${genId}/events`);

    eventSource.addEventListener("generation.update", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        setGenerations((prev) =>
          prev.map((g) =>
            g.id === genId
              ? {
                  ...g,
                  status: data.status,
                  progress: data.progress,
                  videoUrl: data.videoUrl || g.videoUrl,
                  thumbnailUrl: data.thumbnailUrl || g.thumbnailUrl,
                  errorMessage: data.error || g.errorMessage,
                }
              : g
          )
        );

        if (data.status === "COMPLETED" || data.status === "FAILED" || data.status === "CANCELLED") {
          eventSource.close();
        }
      } catch {
        // Parse error
      }
    });

    eventSource.onerror = () => {
      eventSource.close();
    };
  }, []);

  // Submit Generation Handler
  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          negativePrompt: negativePrompt.trim() || undefined,
          modelId: selectedModelId,
          mode,
          duration,
          resolution,
          aspectRatio,
          audio,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
          showToast("You don't have enough credits for this generation. Please buy credits.", "error");
        } else {
          showToast(data.error || "Failed to submit generation", "error");
        }
        return;
      }

      if (data.success && data.generation) {
        showToast("Generation job created! Rendering frames...", "success");
        setGenerations((prev) => [data.generation, ...prev]);
        setSelectedGenId(data.generation.id);

        // Start SSE Realtime Monitoring
        subscribeToEvents(data.generation.id);
      }
    } catch {
      showToast("An unexpected error occurred", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Remix
  const handleRemix = (gen: GenerationCardData) => {
    setPrompt(gen.prompt);
    if (gen.negativePrompt) setNegativePrompt(gen.negativePrompt);
    setSelectedModelId(gen.modelId);
    setMode(gen.mode);
    setDuration(gen.duration);
    setResolution(gen.resolution);
    setAspectRatio(gen.aspectRatio);
    showToast("Original parameters loaded into Studio composer!", "info");
  };

  // Handle Retry
  const handleRetry = async (genId: string) => {
    try {
      const res = await fetch(`/api/generations/${genId}/retry`, { method: "POST" });
      const data = await res.json();

      if (data.success && data.generation) {
        showToast("Retry job created!", "success");
        setGenerations((prev) => [data.generation, ...prev]);
        setSelectedGenId(data.generation.id);
        subscribeToEvents(data.generation.id);
      } else {
        showToast(data.error || "Failed to retry generation", "error");
      }
    } catch {
      showToast("Failed to retry generation", "error");
    }
  };

  // Handle Cancel
  const handleCancel = async (genId: string) => {
    try {
      const res = await fetch(`/api/generations/${genId}/cancel`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        showToast("Generation cancelled. Credits refunded.", "info");
      }
    } catch {
      showToast("Failed to cancel generation", "error");
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden bg-background text-foreground">
      {/* Creation Settings Left Drawer / Sidebar */}
      <CreationSettings
        selectedModelId={selectedModelId}
        onModelChange={setSelectedModelId}
        mode={mode}
        onModeChange={setMode}
        duration={duration}
        onDurationChange={setDuration}
        resolution={resolution}
        onResolutionChange={setResolution}
        aspectRatio={aspectRatio}
        onAspectRatioChange={setAspectRatio}
        audio={audio}
        onAudioChange={setAudio}
        cameraMotion={cameraMotion}
        onCameraMotionChange={setCameraMotion}
        models={models}
        creditCost={creditCost}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden p-6 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              AI Video Generation Studio
            </h1>
            <p className="text-xs text-muted mt-1 font-mono">
              Command industry-leading multi-model video generation engines.
            </p>
          </div>
        </div>

        {/* Center Generations Feed */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {generations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface/30 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto">
                <Wand2 className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-foreground">No Generations Yet</h3>
              <p className="text-xs text-muted max-w-sm mx-auto">
                Enter a prompt below and click <span className="text-accent font-bold">Generate Video</span> to render your first 4K scene.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generations.map((gen) => (
                <GenerationCard
                  key={gen.id}
                  generation={gen}
                  isSelected={gen.id === selectedGenId}
                  onSelect={() => setSelectedGenId(gen.id)}
                  onRemix={handleRemix}
                  onRetry={handleRetry}
                  onCancel={handleCancel}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom Prompt Composer Bar */}
        <div className="rounded-2xl border border-border bg-surface p-4 space-y-3 shadow-2xl shrink-0">
          <div className="space-y-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your scene prompt... (e.g. A cinematic wide shot of a futuristic metropolis at sunset, raining, volumetric lights...)"
              rows={2}
              className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent resize-none font-sans leading-relaxed"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 font-mono text-[11px] text-muted">
              <Badge variant="outline" className="text-accent border-accent/30 text-[10px]">
                {selectedModelId}
              </Badge>
              <span>{duration}</span>
              <span>•</span>
              <span>{resolution}</span>
              <span>•</span>
              <span>{aspectRatio}</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-1 font-mono text-xs font-bold text-accent px-3 py-1.5 rounded-xl bg-accent/10 border border-accent/30">
                <Sparkles className="h-3.5 w-3.5" /> {creditCost} CREDITS
              </div>

              <Button
                id="studio-submit-btn"
                onClick={handleGenerate}
                disabled={!prompt.trim() || isSubmitting}
                className="bg-accent text-accent-foreground hover:bg-accent-hover font-bold text-xs h-10 px-5 shadow-lg cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    Generate Video <Wand2 className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
