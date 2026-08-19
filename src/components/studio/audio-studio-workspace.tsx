"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Mic,
  Music,
  Radio,
  Volume2,
  Sparkles,
  Download,
  RotateCcw,
  Film,
  FolderPlus,
  Trash2,
  Play,
  Pause,
  Sliders,
  Check,
  Star,
  Search,
  FileText,
  Loader2,
  Wand2,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { AudioPlayer } from "@/components/studio/audio-player";
import { submitAudioGenerationAction, toggleFavoriteVoiceAction } from "@/app/actions/audio-actions";

export interface AudioStudioModelItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  creditCost: number;
  providerEstimatedCost: number;
  enabled: boolean;
  supportedModes: string[];
  supportedDurations: string[];
  supportsTTS?: boolean;
  supportsMusic?: boolean;
  supportsSFX?: boolean;
  supportsVoiceover?: boolean;
}

interface VoiceItem {
  id: string;
  name: string;
  language: string;
  gender: string;
  accent: string;
  useCase: string;
}

const VOICES_LIBRARY: VoiceItem[] = [
  { id: "voice-maya", name: "Maya", language: "English", gender: "Female", accent: "US Commercial", useCase: "Voiceover & Narration" },
  { id: "voice-daniel", name: "Daniel", language: "English", gender: "Male", accent: "UK Cinematic", useCase: "Movie Trailers & Drama" },
  { id: "voice-lucas", name: "Lucas", language: "English", gender: "Male", accent: "US Tech", useCase: "Tutorials & Ads" },
  { id: "voice-elena", name: "Elena", language: "Spanish", gender: "Female", accent: "ES Neutral", useCase: "Documentary" },
  { id: "voice-sophie", name: "Sophie", language: "French", gender: "Female", accent: "FR Studio", useCase: "Luxury Commercial" },
  { id: "voice-kenji", name: "Kenji", language: "Japanese", gender: "Male", accent: "JP Tokyo", useCase: "Anime & Gaming" },
];

interface AudioStudioWorkspaceProps {
  initialModels: AudioStudioModelItem[];
  initialGenerations?: any[];
  userFavoriteVoices?: string[];
}

export function AudioStudioWorkspace({
  initialModels,
  initialGenerations = [],
  userFavoriteVoices = [],
}: AudioStudioWorkspaceProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [models] = React.useState<AudioStudioModelItem[]>(initialModels);
  const [selectedModelId, setSelectedModelId] = React.useState<string>(
    initialModels[0]?.slug || initialModels[0]?.id || "vanta-speech-pro"
  );

  const selectedModel =
    models.find((m) => m.id === selectedModelId || m.slug === selectedModelId) || models[0];

  // Mode & Input State
  const [mode, setMode] = React.useState<string>("text-to-speech");
  const [script, setScript] = React.useState<string>(
    "Welcome to VANTA AI, where ideas become cinematic video and audio experiences."
  );
  const [prompt, setPrompt] = React.useState<string>("");
  const [selectedVoiceId, setSelectedVoiceId] = React.useState<string>("voice-maya");
  const [language, setLanguage] = React.useState<string>("English");
  const [duration, setDuration] = React.useState<string>("15s");
  const [template, setTemplate] = React.useState<string>("Movie Trailer");
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  // Voices & Favorites State
  const [voiceSearch, setVoiceSearch] = React.useState("");
  const [favoriteVoices, setFavoriteVoices] = React.useState<string[]>(userFavoriteVoices);

  // Gallery & Selected Audio
  const [generations, setGenerations] = React.useState<any[]>(initialGenerations);
  const [selectedAudio, setSelectedAudio] = React.useState<any | null>(initialGenerations[0] || null);

  // Estimated stats
  const charCount = script.length;
  const estDurationSecs = Math.max(2, Math.ceil(charCount / 15));
  const calculatedCost = (selectedModel?.creditCost || 2) + (mode === "music" ? 1 : 0);

  const filteredVoices = VOICES_LIBRARY.filter(
    (v) =>
      v.name.toLowerCase().includes(voiceSearch.toLowerCase()) ||
      v.language.toLowerCase().includes(voiceSearch.toLowerCase()) ||
      v.accent.toLowerCase().includes(voiceSearch.toLowerCase())
  );

  const handleToggleFavoriteVoice = async (voice: VoiceItem) => {
    try {
      await toggleFavoriteVoiceAction(voice.id, voice.name);
      setFavoriteVoices((prev) =>
        prev.includes(voice.id) ? prev.filter((id) => id !== voice.id) : [...prev, voice.id]
      );
      showToast(`Updated favorite voice '${voice.name}'`, "success");
    } catch {
      showToast("Failed to update favorite voice", "error");
    }
  };

  const handleGenerateAudio = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (mode === "text-to-speech" && !script.trim()) {
      showToast("Please enter a script text for Text-to-Speech", "error");
      return;
    }
    if ((mode === "sound-effects" || mode === "music") && !prompt.trim()) {
      showToast("Please enter a prompt describing the sound or music", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitAudioGenerationAction({
        modelId: selectedModelId,
        mode,
        prompt: prompt.trim() || `${mode} audio track`,
        script: script.trim(),
        voiceId: selectedVoiceId,
        language,
        duration,
        template,
      });

      showToast("AI Audio track generated successfully!", "success");
      setGenerations((prev) => [res.generation, ...prev]);
      setSelectedAudio(res.generation);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate audio";
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: Add to Video (Audio to Video Handoff) (Requirement)
  const handleAddToVideo = (audioUrl: string) => {
    showToast("Opening Video Studio with selected audio track...", "info");
    router.push(`/studio/video?referenceAudio=${encodeURIComponent(audioUrl)}`);
  };

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden bg-background text-foreground font-sans">
      {/* ─── LEFT SIDEBAR: CREATION MODES & VOICE LIBRARY ────────────────── */}
      <aside className="w-full lg:w-80 border-r border-border bg-[#09090b] flex flex-col h-full overflow-y-auto shrink-0 p-4 space-y-6">
        <div className="border-b border-border pb-3 flex items-center justify-between">
          <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Radio className="h-4 w-4 text-accent" /> Audio Studio Tools
          </h2>
          <Badge variant="outline" className="text-[10px] font-mono text-accent border-accent/30">
            {calculatedCost} CREDITS
          </Badge>
        </div>

        {/* Audio Engine Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
            AI Audio Engine
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

        {/* Creation Modes Grid */}
        <div className="space-y-2">
          <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
            Audio Mode
          </label>
          <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
            {[
              { id: "text-to-speech", label: "Text to Speech", icon: Mic },
              { id: "voiceover", label: "Voiceover", icon: Radio },
              { id: "sound-effects", label: "Sound Effects", icon: Volume2 },
              { id: "music", label: "AI Music", icon: Music },
              { id: "audio-enhancement", label: "Clean Audio", icon: Sparkles },
              { id: "transcription", label: "Transcribe", icon: FileText },
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

        {/* Voice Library Section (If TTS or Voiceover) */}
        {(mode === "text-to-speech" || mode === "voiceover") && (
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
              <span>Voice Library</span>
              <span className="text-[10px] text-accent font-bold">{filteredVoices.length} Voices</span>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
              <input
                type="text"
                value={voiceSearch}
                onChange={(e) => setVoiceSearch(e.target.value)}
                placeholder="Search voices or accents..."
                className="w-full rounded-lg border border-border bg-surface pl-8 pr-2 py-1.5 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
              />
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-none">
              {filteredVoices.map((voice) => {
                const isSelected = selectedVoiceId === voice.id;
                const isFav = favoriteVoices.includes(voice.id);
                return (
                  <div
                    key={voice.id}
                    onClick={() => setSelectedVoiceId(voice.id)}
                    className={`p-2 rounded-xl border flex items-center justify-between text-xs transition-all cursor-pointer ${
                      isSelected
                        ? "bg-accent/10 border-accent/40 text-accent font-bold"
                        : "bg-surface border-border text-muted hover:text-foreground"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-bold flex items-center gap-1.5">
                        <span className="truncate">{voice.name}</span>
                        <Badge variant="outline" className="text-[9px] font-mono text-muted border-border px-1 py-0">
                          {voice.gender}
                        </Badge>
                      </div>
                      <div className="text-[10px] font-mono text-muted truncate mt-0.5">
                        {voice.language} • {voice.accent}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavoriteVoice(voice);
                      }}
                      className={`p-1 hover:scale-110 transition-transform ${isFav ? "text-yellow-400" : "text-muted"}`}
                    >
                      <Star className="h-3.5 w-3.5 fill-current" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </aside>

      {/* ─── CENTER: SCRIPT / PROMPT WORKSPACE & RESULTS ────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden p-6 space-y-6 font-sans">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Mic className="h-6 w-6 text-accent" /> Multi-Model AI Audio Studio
            </h1>
            <p className="text-xs text-muted mt-1 font-mono">
              Natural Text-to-Speech, Voiceovers, Sound Effects & Cinematic AI Music.
            </p>
          </div>
        </div>

        {/* Active Audio Player (If audio selected) */}
        {selectedAudio && (
          <AudioPlayer
            src={selectedAudio.audioUrl || selectedAudio.videoUrl || "/werewolf_cinematic_preview.jpg"}
            title={selectedAudio.prompt || "AI Audio Generation"}
            onAddToVideo={() =>
              handleAddToVideo(selectedAudio.audioUrl || selectedAudio.videoUrl || "/werewolf_cinematic_preview.jpg")
            }
          />
        )}

        {/* Gallery / History list of tracks */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {generations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface/30 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto">
                <Music className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-foreground">No Audio Tracks Generated Yet</h3>
              <p className="text-xs text-muted max-w-sm mx-auto font-mono">
                Type a script or prompt below and click <span className="text-accent font-bold">Generate Audio</span>.
              </p>
            </div>
          ) : (
            generations.map((gen) => {
              const isSelected = selectedAudio?.id === gen.id;
              return (
                <div
                  key={gen.id}
                  onClick={() => setSelectedAudio(gen)}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-4 transition-all cursor-pointer ${
                    isSelected ? "border-accent bg-accent/5 shadow-md" : "border-border bg-surface hover:border-accent/40"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center text-accent shrink-0">
                      <Music className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-foreground truncate">
                        {gen.prompt || "AI Audio Track"}
                      </div>
                      <div className="text-[10px] font-mono text-muted flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[9px] text-accent border-accent/30">
                          {gen.mode}
                        </Badge>
                        <span>{gen.duration || "15s"}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToVideo(gen.audioUrl || gen.videoUrl || "/werewolf_cinematic_preview.jpg");
                    }}
                    className="text-xs font-mono text-accent hover:underline shrink-0"
                  >
                    Add to Video →
                  </Button>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Script / Prompt Composer */}
        <div className="rounded-2xl border border-border bg-surface p-4 space-y-3 shadow-2xl shrink-0 font-sans">
          {mode === "text-to-speech" || mode === "voiceover" ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-muted">
                <span>Script Editor</span>
                <span>
                  {charCount} chars • ~{estDurationSecs}s speech duration
                </span>
              </div>
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="Enter speech script..."
                rows={3}
                className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent resize-none leading-relaxed"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono text-muted">Audio Prompt</div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the sound effect or music... (e.g. Emotional cinematic piano with subtle strings, heavy rain on metal roof...)"
                rows={2}
                className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent resize-none leading-relaxed"
              />
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 font-mono text-[11px] text-muted">
              <Badge variant="outline" className="text-accent border-accent/30 text-[10px]">
                {selectedModel?.name || selectedModelId}
              </Badge>
              <span>{mode}</span>
              <span>•</span>
              <span>{language}</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-1 font-mono text-xs font-bold text-accent px-3 py-1.5 rounded-xl bg-accent/10 border border-accent/30">
                <Sparkles className="h-3.5 w-3.5" /> {calculatedCost} CREDITS
              </div>

              <Button
                onClick={handleGenerateAudio}
                disabled={isSubmitting}
                className="bg-accent text-accent-foreground hover:bg-accent-hover font-bold text-xs h-10 px-5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Synthesizing...
                  </>
                ) : (
                  <>
                    Generate Audio <Wand2 className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* ─── RIGHT SIDEBAR: SELECTED AUDIO INSPECTOR ─────────────────────── */}
      {selectedAudio && (
        <aside className="w-full lg:w-80 border-l border-border bg-[#09090b] flex flex-col h-full overflow-y-auto shrink-0 p-4 space-y-6 font-sans">
          <div className="border-b border-border pb-3 flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground">Audio Inspector</h3>
            <Badge variant="outline" className="text-[10px] font-mono text-accent border-accent/30">
              {selectedAudio.mode}
            </Badge>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <div className="text-[10px] text-muted uppercase">Script / Prompt</div>
              <p className="text-foreground italic mt-0.5 leading-relaxed font-sans">
                &ldquo;{selectedAudio.prompt}&rdquo;
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
              <div>
                <span className="text-[10px] text-muted block">CREDIT COST:</span>
                <span className="font-bold text-accent">{selectedAudio.creditCost || 2} CR</span>
              </div>
              <div>
                <span className="text-[10px] text-muted block">DURATION:</span>
                <span className="font-bold text-foreground">{selectedAudio.duration || "15s"}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-border font-mono text-xs">
            <Button
              onClick={() =>
                handleAddToVideo(selectedAudio.audioUrl || selectedAudio.videoUrl || "/werewolf_cinematic_preview.jpg")
              }
              className="w-full bg-accent text-accent-foreground font-bold h-9 text-xs cursor-pointer"
            >
              <Film className="h-4 w-4 mr-2" /> Add to Video Studio
            </Button>

            <a
              href={selectedAudio.audioUrl || selectedAudio.videoUrl || "/werewolf_cinematic_preview.jpg"}
              target="_blank"
              rel="noreferrer"
              download="vanta-audio.mp3"
              className="block"
            >
              <Button variant="outline" className="w-full text-xs font-mono border-border h-9">
                <Download className="h-4 w-4 mr-2" /> Download Audio
              </Button>
            </a>
          </div>
        </aside>
      )}
    </div>
  );
}
