"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Wand2,
  ImageIcon,
  Download,
  RotateCcw,
  Film,
  User,
  MapPin,
  Palette,
  Trash2,
  Maximize2,
  Sliders,
  Scissors,
  Layers,
  ShoppingBag,
  Loader2,
  Check,
  ChevronDown,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { InpaintCanvas } from "@/components/studio/inpaint-canvas";
import { submitImageGenerationAction, saveAsProjectElementAction } from "@/app/actions/image-actions";

export interface ImageStudioModelItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  creditCost: number;
  providerEstimatedCost: number;
  enabled: boolean;
  supportedModes: string[];
  supportedResolutions: string[];
  supportedAspectRatios: string[];
  supportsInpainting?: boolean;
  supportsOutpainting?: boolean;
  supportsBackgroundRemoval?: boolean;
  supportsBackgroundReplacement?: boolean;
  supportsUpscale?: boolean;
  provider?: { name: string; slug: string } | null;
}

interface ImageStudioWorkspaceProps {
  initialModels: ImageStudioModelItem[];
  initialGenerations?: any[];
}

export function ImageStudioWorkspace({ initialModels, initialGenerations = [] }: ImageStudioWorkspaceProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [models, setModels] = React.useState<ImageStudioModelItem[]>(initialModels);
  const [selectedModelId, setSelectedModelId] = React.useState<string>(
    initialModels[0]?.slug || initialModels[0]?.id || "fal-flux-schnell"
  );

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const targetModelSlug = urlParams.get("model")?.toLowerCase().trim();

    if (targetModelSlug && models.length > 0) {
      const match = models.find(
        (m) => m.slug.toLowerCase() === targetModelSlug || m.id.toLowerCase() === targetModelSlug || m.name.toLowerCase().replace(/\s+/g, "-") === targetModelSlug
      );
      if (match) {
        setSelectedModelId(match.slug || match.id);
      } else {
        showToast("That model is unavailable. We've selected another available model.", "info");
      }
    }
  }, [models, showToast]);

  const selectedModel =
    models.find((m) => m.id === selectedModelId || m.slug === selectedModelId) || models[0];

  // Form State
  const [mode, setMode] = React.useState<string>("text-to-image");
  const [prompt, setPrompt] = React.useState<string>("");
  const [negativePrompt, setNegativePrompt] = React.useState<string>("");
  const [aspectRatio, setAspectRatio] = React.useState<string>("1:1");
  const [resolution, setResolution] = React.useState<string>("1080p");
  const [productTemplate, setProductTemplate] = React.useState<string>("Luxury Studio");
  const [sourceImageUrl, setSourceImageUrl] = React.useState<string>("");
  const [maskUrl, setMaskUrl] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  // Gallery & Selected Image
  const [generations, setGenerations] = React.useState<any[]>(initialGenerations);
  const [selectedImage, setSelectedImage] = React.useState<any | null>(initialGenerations[0] || null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Credit calculation
  const calculatedCost = (selectedModel?.creditCost || 3) + (mode === "upscale" ? 2 : mode === "product-photography" ? 2 : 0);

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setSourceImageUrl(evt.target.result as string);
        showToast("Source image uploaded!", "info");
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Image Generation
  const handleGenerateImage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() && mode !== "background-removal" && mode !== "upscale") {
      showToast("Please enter an image prompt", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitImageGenerationAction({
        modelId: selectedModelId,
        mode,
        prompt: prompt.trim() || `${mode} synthesis`,
        negativePrompt: negativePrompt.trim() || undefined,
        aspectRatio,
        resolution,
        sourceImageUrl: sourceImageUrl || undefined,
        maskUrl: maskUrl || undefined,
        productTemplate: mode === "product-photography" ? productTemplate : undefined,
      });

      showToast("AI Image generated successfully!", "success");
      setGenerations((prev) => [res.generation, ...prev]);
      setSelectedImage(res.generation);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate image";
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: Animate (Image to Video Handoff) (Requirement)
  const handleAnimateImage = (imgUrl: string) => {
    showToast("Opening Video Studio with selected image...", "info");
    router.push(`/studio/video?referenceImage=${encodeURIComponent(imgUrl)}`);
  };

  // Action: Save as Character / Location Element
  const handleSaveAsElement = async (type: "CHARACTER" | "LOCATION" | "STYLE", assetId: string) => {
    try {
      await saveAsProjectElementAction({
        name: `${type.toLowerCase()}_${Date.now().toString().slice(-4)}`,
        type,
        referenceAssetId: assetId,
        prompt: selectedImage?.prompt,
      });
      showToast(`Saved as reusable ${type} reference!`, "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save element";
      showToast(msg, "error");
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden bg-background text-foreground font-sans">
      {/* ─── LEFT SIDEBAR: CREATION MODES & TOOLS ───────────────────────── */}
      <aside className="w-full lg:w-80 border-r border-border bg-[#09090b] flex flex-col h-full overflow-y-auto shrink-0 p-4 space-y-6">
        {/* Header */}
        <div className="border-b border-border pb-3 flex items-center justify-between">
          <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-accent" /> Image Studio Tools
          </h2>
          <Badge variant="outline" className="text-[10px] font-mono text-accent border-accent/30">
            {calculatedCost} CREDITS
          </Badge>
        </div>

        {/* Model Engine Selector */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
              AI Image Engine
            </label>
            {selectedModel?.provider?.slug === "fal" ? (
              <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30 shadow-sm animate-pulse">
                ⚡ LIVE PROVIDER TEST
              </span>
            ) : (
              <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                VANTA Test Image (Mock)
              </span>
            )}
          </div>
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

        {/* Creation Modes Grid */}
        <div className="space-y-2">
          <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
            Creation Mode
          </label>
          <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
            {[
              { id: "text-to-image", label: "Text to Image", icon: Sparkles },
              { id: "image-to-image", label: "Image to Image", icon: ImageIcon },
              { id: "inpaint", label: "Inpaint / Edit", icon: Scissors },
              { id: "product-photography", label: "Product Shot", icon: ShoppingBag },
              { id: "background-removal", label: "Remove Bg", icon: Layers },
              { id: "background-replacement", label: "Replace Bg", icon: Palette },
              { id: "generative-fill", label: "Generative Fill", icon: Wand2 },
              { id: "upscale", label: "AI Upscale", icon: Maximize2 },
            ].map((tool) => {
              const Icon = tool.icon;
              const isActive = mode === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => setMode(tool.id)}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                    isActive
                      ? "bg-accent/15 text-accent border-accent/40 font-bold"
                      : "bg-surface border-border text-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate text-[11px]">{tool.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Shot Templates (If product-photography mode) */}
        {mode === "product-photography" && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
              Product Studio Template
            </label>
            <select
              value={productTemplate}
              onChange={(e) => setProductTemplate(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl p-2 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
            >
              <option value="Luxury Studio">Luxury Studio</option>
              <option value="Minimal White">Minimal White</option>
              <option value="Outdoor Lifestyle">Outdoor Lifestyle</option>
              <option value="Dark Premium">Dark Premium</option>
              <option value="Beauty Commercial">Beauty Commercial</option>
              <option value="Tech Advertisement">Tech Advertisement</option>
              <option value="Fashion Editorial">Fashion Editorial</option>
            </select>
          </div>
        )}

        {/* Aspect Ratio Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
            Aspect Ratio
          </label>
          <div className="grid grid-cols-4 gap-1">
            {["1:1", "16:9", "9:16", "4:3"].map((ratio) => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                className={`py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                  aspectRatio === ratio
                    ? "bg-accent text-accent-foreground border-accent"
                    : "bg-surface border-border text-muted hover:text-foreground"
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>

        {/* Source Image Upload Dropzone */}
        {(mode !== "text-to-image" || sourceImageUrl) && (
          <div className="space-y-2">
            <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
              Source Image Reference
            </label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-3 text-center bg-surface/40 hover:bg-surface transition-colors cursor-pointer"
            >
              {sourceImageUrl ? (
                <img src={sourceImageUrl} alt="Source upload" className="max-h-32 mx-auto rounded-lg object-contain" />
              ) : (
                <div className="text-xs font-mono text-muted">Click to upload source image</div>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* ─── CENTER: PROMPT COMPOSER & IMAGE GALLERY ─────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden p-6 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-accent" /> Multi-Model AI Image Studio
            </h1>
            <p className="text-xs text-muted mt-1 font-mono">
              High-resolution AI image synthesis, inpainting, background edits & product shot staging.
            </p>
          </div>
        </div>

        {/* Inpaint Mask Canvas (If inpaint mode) */}
        {mode === "inpaint" && sourceImageUrl ? (
          <div className="flex-1 overflow-y-auto">
            <InpaintCanvas imageSrc={sourceImageUrl} onMaskChange={setMaskUrl} />
          </div>
        ) : (
          /* Gallery Grid */
          <div className="flex-1 overflow-y-auto space-y-4">
            {generations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-surface/30 p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-foreground">No Images Generated Yet</h3>
                <p className="text-xs text-muted max-w-sm mx-auto font-mono">
                  Type a prompt below and click <span className="text-accent font-bold">Generate Image</span>.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {generations.map((gen) => {
                  const isSelected = selectedImage?.id === gen.id;
                  const imgUrl = gen.imageUrl || gen.videoUrl || "/werewolf_cinematic_preview.jpg";

                  return (
                    <div
                      key={gen.id}
                      onClick={() => setSelectedImage(gen)}
                      className={`group relative aspect-square rounded-2xl border overflow-hidden cursor-pointer transition-all ${
                        isSelected
                          ? "border-accent ring-2 ring-accent/30 shadow-lg"
                          : "border-border hover:border-accent/50"
                      }`}
                    >
                      <img src={imgUrl} alt={gen.prompt} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between">
                        <Badge variant="outline" className="self-end text-[9px] font-mono bg-background/80 text-accent border-accent/30">
                          {gen.aspectRatio || "1:1"}
                        </Badge>
                        <p className="text-[11px] text-white font-sans line-clamp-2 italic">
                          &ldquo;{gen.prompt}&rdquo;
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Bottom Prompt Composer Bar */}
        <div className="rounded-2xl border border-border bg-surface p-4 space-y-3 shadow-2xl shrink-0 font-sans">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to create... (e.g. A futuristic luxury sports car outside a glass mansion at sunset...)"
            rows={2}
            className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent resize-none leading-relaxed"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 font-mono text-[11px] text-muted">
              <Badge variant="outline" className="text-accent border-accent/30 text-[10px]">
                {selectedModel?.name || selectedModelId}
              </Badge>
              <span>{mode}</span>
              <span>•</span>
              <span>{aspectRatio}</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-1 font-mono text-xs font-bold text-accent px-3 py-1.5 rounded-xl bg-accent/10 border border-accent/30">
                <Sparkles className="h-3.5 w-3.5" /> {calculatedCost} CREDITS
              </div>

              <Button
                onClick={handleGenerateImage}
                disabled={!prompt.trim() || isSubmitting}
                className="bg-accent text-accent-foreground hover:bg-accent-hover font-bold text-xs h-10 px-5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    Generate Image <Wand2 className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* ─── RIGHT SIDEBAR: SELECTED IMAGE INSPECTOR & ACTIONS ───────────── */}
      {selectedImage && (
        <aside className="w-full lg:w-80 border-l border-border bg-[#09090b] flex flex-col h-full overflow-y-auto shrink-0 p-4 space-y-6 font-sans">
          <div className="border-b border-border pb-3 flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground">Image Inspector</h3>
            <Badge variant="outline" className="text-[10px] font-mono text-accent border-accent/30">
              {selectedImage.aspectRatio || "1:1"}
            </Badge>
          </div>

          {/* Large Image Preview */}
          <div className="aspect-square rounded-2xl border border-border bg-background overflow-hidden relative">
            <img
              src={selectedImage.imageUrl || selectedImage.videoUrl || ""}
              alt={selectedImage.prompt}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Prompt & Metadata Specs */}
          <div className="space-y-3 font-mono text-xs">
            <div>
              <div className="text-[10px] text-muted uppercase">Prompt</div>
              <p className="text-foreground italic mt-0.5 leading-relaxed font-sans">
                &ldquo;{selectedImage.prompt}&rdquo;
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
              <div>
                <span className="text-[10px] text-muted block">CREDIT COST:</span>
                <span className="font-bold text-accent">{selectedImage.creditCost || 3} CR</span>
              </div>
              <div>
                <span className="text-[10px] text-muted block">RESOLUTION:</span>
                <span className="font-bold text-foreground">{selectedImage.resolution || "1080p"}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2 border-t border-border font-mono text-xs">
            {/* ANIMATE TO VIDEO STUDIO (REQUIREMENT: IMAGE -> VIDEO HANDOFF) */}
            <Button
              onClick={() =>
                handleAnimateImage(selectedImage.imageUrl || selectedImage.videoUrl || "/werewolf_cinematic_preview.jpg")
              }
              className="w-full bg-accent text-accent-foreground font-bold h-9 text-xs cursor-pointer"
            >
              <Film className="h-4 w-4 mr-2" /> Animate in Video Studio
            </Button>

            {/* DOWNLOAD */}
            <a
              href={selectedImage.imageUrl || selectedImage.videoUrl || "/werewolf_cinematic_preview.jpg"}
              target="_blank"
              rel="noreferrer"
              download="vanta-ai-image.png"
              className="block"
            >
              <Button variant="outline" className="w-full text-xs font-mono border-border h-9">
                <Download className="h-4 w-4 mr-2" /> Download Image
              </Button>
            </a>

            {/* REMIX */}
            <Button
              variant="outline"
              onClick={() => {
                setPrompt(selectedImage.prompt);
                showToast("Preloaded image prompt into composer!", "info");
              }}
              className="w-full text-xs font-mono border-border h-9"
            >
              <RotateCcw className="h-4 w-4 mr-2" /> Remix Image
            </Button>

            {/* SAVE AS CHARACTER / LOCATION REFERENCE */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => handleSaveAsElement("CHARACTER", selectedImage.id)}
                className="text-[11px] font-mono border-border h-8"
              >
                <User className="h-3.5 w-3.5 mr-1" /> Character
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSaveAsElement("LOCATION", selectedImage.id)}
                className="text-[11px] font-mono border-border h-8"
              >
                <MapPin className="h-3.5 w-3.5 mr-1" /> Location
              </Button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
