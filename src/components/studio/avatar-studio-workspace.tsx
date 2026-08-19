"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Film,
  Mic,
  Sparkles,
  Wand2,
  Download,
  RotateCcw,
  ShieldCheck,
  Play,
  Pause,
  Upload,
  Check,
  ChevronDown,
  Loader2,
  Info,
  Sliders,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { submitAvatarGenerationAction } from "@/app/actions/avatar-actions";

export interface AvatarStudioModelItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  creditCost: number;
  providerEstimatedCost: number;
  enabled: boolean;
  supportedModes: string[];
  supportedDurations: string[];
  supportsAvatar?: boolean;
  supportsLipSync?: boolean;
  supportsHeadMotion?: boolean;
}

interface AvatarStudioWorkspaceProps {
  initialModels: AvatarStudioModelItem[];
  userAssets: {
    imageAssets: any[];
    videoAssets: any[];
    audioAssets: any[];
    characters: any[];
  };
  initialGenerations?: any[];
}

export function AvatarStudioWorkspace({
  initialModels,
  userAssets,
  initialGenerations = [],
}: AvatarStudioWorkspaceProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [models] = React.useState<AvatarStudioModelItem[]>(initialModels);
  const [selectedModelId, setSelectedModelId] = React.useState<string>(
    initialModels[0]?.slug || initialModels[0]?.id || "fal-latentsync"
  );

  const selectedModel =
    models.find((m) => m.id === selectedModelId || m.slug === selectedModelId) || models[0];

  // Active Tab Mode
  const [activeTab, setActiveTab] = React.useState<"talking-avatar" | "lip-sync">("talking-avatar");

  // Input Selection State
  const [portraitUrl, setPortraitUrl] = React.useState<string>("");
  const [videoUrl, setVideoUrl] = React.useState<string>("");
  const [audioUrl, setAudioUrl] = React.useState<string>("");
  const [scriptText, setScriptText] = React.useState<string>(
    "Hello! Welcome to VANTA AI, where you can turn any portrait or video into a talking avatar."
  );
  const [voiceId, setVoiceId] = React.useState<string>("voice-maya");
  const [motionPreset, setMotionPreset] = React.useState<string>("Natural");
  const [resolution, setResolution] = React.useState<string>("1080p");
  const [consentConfirmed, setConsentConfirmed] = React.useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  // Gallery & Selected Result
  const [generations, setGenerations] = React.useState<any[]>(initialGenerations);
  const [selectedResult, setSelectedResult] = React.useState<any | null>(initialGenerations[0] || null);

  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const videoInputRef = React.useRef<HTMLInputElement>(null);

  // Credit calculation
  const ttsCost = !audioUrl && scriptText ? 2 : 0;
  const avatarCost = selectedModel?.creditCost || 5;
  const totalCost = ttsCost + avatarCost;

  // File Upload Handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setPortraitUrl(evt.target.result as string);
        showToast("Portrait image loaded!", "info");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setVideoUrl(evt.target.result as string);
        showToast("Source video loaded!", "info");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (activeTab === "talking-avatar" && !portraitUrl) {
      showToast("Please upload or select a portrait image", "error");
      return;
    }

    if (activeTab === "lip-sync" && !videoUrl) {
      showToast("Please upload or select a source video for Lip Sync", "error");
      return;
    }

    if (!audioUrl && !scriptText.trim()) {
      showToast("Please enter a speech script or select an audio asset", "error");
      return;
    }

    if (!consentConfirmed) {
      showToast("Please confirm authorization attestation before generating", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitAvatarGenerationAction({
        modelId: selectedModelId,
        mode: activeTab,
        portraitImageUrl: portraitUrl || undefined,
        sourceVideoUrl: videoUrl || undefined,
        audioUrl: audioUrl || undefined,
        scriptText: scriptText.trim(),
        voiceId,
        motionPreset,
        resolution,
        consentConfirmed,
      });

      showToast("Talking Avatar video generated successfully!", "success");
      setGenerations((prev) => [res.generation, ...prev]);
      setSelectedResult(res.generation);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate talking avatar";
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden bg-background text-foreground font-sans">
      {/* ─── LEFT SIDEBAR: MODE TABS & SOURCE SELECTORS ──────────────────── */}
      <aside className="w-full lg:w-80 border-r border-border bg-[#09090b] flex flex-col h-full overflow-y-auto shrink-0 p-4 space-y-6">
        <div className="border-b border-border pb-3 flex items-center justify-between">
          <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
            <User className="h-4 w-4 text-accent" /> Avatar Controls
          </h2>
          <Badge variant="outline" className="text-[10px] font-mono text-accent border-accent/30">
            {totalCost} CREDITS
          </Badge>
        </div>

        {/* Mode Tabs: Talking Avatar vs Lip Sync */}
        <div className="grid grid-cols-2 gap-1 bg-surface p-1 rounded-xl border border-border text-xs font-mono font-bold">
          <button
            onClick={() => setActiveTab("talking-avatar")}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === "talking-avatar" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted hover:text-foreground"
            }`}
          >
            Talking Avatar
          </button>
          <button
            onClick={() => setActiveTab("lip-sync")}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === "lip-sync" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted hover:text-foreground"
            }`}
          >
            Lip Sync
          </button>
        </div>

        {/* AI Model Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
            Avatar Model Engine
          </label>
          <select
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
          >
            {models.map((m) => (
              <option key={m.id} value={m.slug}>
                {m.name} ({m.creditCost} credits)
              </option>
            ))}
          </select>
        </div>

        {/* Source Portrait Selector (Talking Avatar) */}
        {activeTab === "talking-avatar" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
              <span>Portrait Image</span>
              <button onClick={() => imageInputRef.current?.click()} className="text-accent hover:underline">
                UPLOAD
              </button>
            </div>
            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

            <div
              onClick={() => imageInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-3 text-center bg-surface/40 hover:bg-surface transition-colors cursor-pointer"
            >
              {portraitUrl ? (
                <img src={portraitUrl} alt="Portrait" className="max-h-36 mx-auto rounded-xl object-cover" />
              ) : (
                <div className="text-xs font-mono text-muted py-3">Click or drop portrait image</div>
              )}
            </div>

            {/* Existing Image Asset Selector Dropdown */}
            {userAssets.imageAssets.length > 0 && (
              <select
                onChange={(e) => setPortraitUrl(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs font-mono text-muted"
              >
                <option value="">-- Choose from Image Assets --</option>
                {userAssets.imageAssets.map((asset) => (
                  <option key={asset.id} value={asset.url}>
                    {asset.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Source Video Selector (Lip Sync) */}
        {activeTab === "lip-sync" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
              <span>Source Video</span>
              <button onClick={() => videoInputRef.current?.click()} className="text-accent hover:underline">
                UPLOAD
              </button>
            </div>
            <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />

            <div
              onClick={() => videoInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-3 text-center bg-surface/40 hover:bg-surface transition-colors cursor-pointer"
            >
              {videoUrl ? (
                <div className="text-xs font-mono text-accent font-bold">Video Loaded</div>
              ) : (
                <div className="text-xs font-mono text-muted py-3">Click or drop source video</div>
              )}
            </div>

            {userAssets.videoAssets.length > 0 && (
              <select
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs font-mono text-muted"
              >
                <option value="">-- Choose from Video Assets --</option>
                {userAssets.videoAssets.map((asset) => (
                  <option key={asset.id} value={asset.url}>
                    {asset.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Motion Presets */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
            Motion Preset
          </label>
          <select
            value={motionPreset}
            onChange={(e) => setMotionPreset(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
          >
            <option value="Natural">Natural Gesture</option>
            <option value="Professional">Professional Presenter</option>
            <option value="Energetic">Energetic Commercial</option>
            <option value="Calm">Calm Documentary</option>
            <option value="Cinematic">Cinematic Feature</option>
          </select>
        </div>
      </aside>

      {/* ─── CENTER: WORKSPACE & RESULT VIDEO ─────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden p-6 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <User className="h-6 w-6 text-accent" /> AI Talking Avatar & Lip Sync Studio
            </h1>
            <p className="text-xs text-muted mt-1 font-mono">
              Synchronize mouth movement & head gestures for photorealistic talking characters.
            </p>
          </div>
        </div>

        {/* Video Player or Placeholder Canvas */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {selectedResult ? (
            <div className="aspect-video w-full max-h-[480px] rounded-2xl border border-border bg-black overflow-hidden relative shadow-2xl mx-auto">
              <video
                src={selectedResult.videoUrl || selectedResult.imageUrl || "/werewolf_cinematic_preview.jpg"}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-surface/30 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto">
                <User className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-foreground">No Avatar Video Generated Yet</h3>
              <p className="text-xs text-muted max-w-sm mx-auto font-mono">
                Select a portrait image and speech input below, then click <span className="text-accent font-bold">Generate Avatar</span>.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Script & Audio Selector */}
        <div className="rounded-2xl border border-border bg-surface p-4 space-y-3 shadow-2xl shrink-0 font-sans">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-muted">
              <span>Speech Input (Script or Existing Audio)</span>
              {userAssets.audioAssets.length > 0 && (
                <select
                  onChange={(e) => setAudioUrl(e.target.value)}
                  className="bg-background border border-border rounded-lg px-2 py-1 text-[10px] text-accent"
                >
                  <option value="">-- Use Existing Audio Asset --</option>
                  {userAssets.audioAssets.map((audio) => (
                    <option key={audio.id} value={audio.url}>
                      {audio.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <textarea
              value={scriptText}
              onChange={(e) => {
                setScriptText(e.target.value);
                setAudioUrl("");
              }}
              placeholder="Enter speech script for automatic TTS stage..."
              rows={2}
              className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent resize-none leading-relaxed"
            />
          </div>

          {/* Safety Attestation Checkbox (REQUIREMENT) */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-background/60">
            <input
              type="checkbox"
              id="avatar-attestation"
              checked={consentConfirmed}
              onChange={(e) => setConsentConfirmed(e.target.checked)}
              className="h-4 w-4 accent-[#c8ff00] cursor-pointer shrink-0"
            />
            <label htmlFor="avatar-attestation" className="text-[11px] font-mono text-muted cursor-pointer">
              I confirm I have explicit authorization & consent to use this image/video and voice sample.
            </label>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 font-mono text-[11px] text-muted">
              <Badge variant="outline" className="text-accent border-accent/30 text-[10px]">
                {selectedModel?.name || selectedModelId}
              </Badge>
              <span>{activeTab}</span>
              {ttsCost > 0 && (
                <span>• Stage 1 (TTS): +{ttsCost} CR</span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-1 font-mono text-xs font-bold text-accent px-3 py-1.5 rounded-xl bg-accent/10 border border-accent/30">
                <Sparkles className="h-3.5 w-3.5" /> {totalCost} CREDITS
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isSubmitting || !consentConfirmed}
                className="bg-accent text-accent-foreground hover:bg-accent-hover font-bold text-xs h-10 px-5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Rendering Avatar...
                  </>
                ) : (
                  <>
                    Generate Avatar <Wand2 className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* ─── RIGHT SIDEBAR: SELECTED RESULT INSPECTOR ────────────────────── */}
      {selectedResult && (
        <aside className="w-full lg:w-80 border-l border-border bg-[#09090b] flex flex-col h-full overflow-y-auto shrink-0 p-4 space-y-6 font-sans">
          <div className="border-b border-border pb-3 flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground">Avatar Inspector</h3>
            <Badge variant="outline" className="text-[10px] font-mono text-accent border-accent/30">
              {selectedResult.mode || activeTab}
            </Badge>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <div className="text-[10px] text-muted uppercase">Prompt / Speech</div>
              <p className="text-foreground italic mt-0.5 leading-relaxed font-sans">
                &ldquo;{selectedResult.prompt}&rdquo;
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
              <div>
                <span className="text-[10px] text-muted block">CREDIT COST:</span>
                <span className="font-bold text-accent">{selectedResult.creditCost || totalCost} CR</span>
              </div>
              <div>
                <span className="text-[10px] text-muted block">RESOLUTION:</span>
                <span className="font-bold text-foreground">{selectedResult.resolution || "1080p"}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-border font-mono text-xs">
            <a
              href={selectedResult.videoUrl || selectedResult.imageUrl || "/werewolf_cinematic_preview.jpg"}
              target="_blank"
              rel="noreferrer"
              download="vanta-talking-avatar.mp4"
              className="block"
            >
              <Button variant="outline" className="w-full text-xs font-mono border-border h-9">
                <Download className="h-4 w-4 mr-2" /> Download Video
              </Button>
            </a>

            <Button
              variant="outline"
              onClick={() => {
                if (selectedResult.prompt) setScriptText(selectedResult.prompt);
                showToast("Preloaded avatar settings into studio!", "info");
              }}
              className="w-full text-xs font-mono border-border h-9"
            >
              <RotateCcw className="h-4 w-4 mr-2" /> Remix Avatar
            </Button>
          </div>
        </aside>
      )}
    </div>
  );
}
