"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Play, Pause, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const HERO_PROMPTS = [
  "A cinematic 4K video of an ancient silver werewolf howling under a glowing full moon in a foggy mystical pine forest, volumetric atmospheric fog, photorealistic fur physics...",
  "A stunning cinematic wide shot of a futuristic neon metropolis at night, rain pouring on glossy dark asphalt with cybernetic vehicle light trails...",
  "Macro shot of bioluminescent mechanical iris expanding, glowing emerald optical sensors focusing with volumetric dust particles...",
];

export default function Hero() {
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [activePromptIdx, setActivePromptIdx] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(2.4);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  // Cycle prompts periodically
  React.useEffect(() => {
    const interval = setInterval(() => {
      setActivePromptIdx((prev) => (prev + 1) % HERO_PROMPTS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Update mock video time counter
  React.useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setCurrentTime((prev) => (prev >= 8 ? 0 : prev + 0.1));
    }, 100);
    return () => clearInterval(timer);
  }, [isPlaying]);

  // Render moving particle/wave canvas simulation
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let step = 0;

    const render = () => {
      step += isPlaying ? 0.03 : 0.005;
      const width = (canvas.width = canvas.clientWidth);
      const height = (canvas.height = canvas.clientHeight);

      ctx.clearRect(0, 0, width, height);

      // Dark background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#090d16");
      bgGrad.addColorStop(0.5, "#0e1a24");
      bgGrad.addColorStop(1, "#05090e");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Animated neon glowing wave lines
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.lineWidth = 2 + i;
        ctx.strokeStyle =
          i % 2 === 0 ? "rgba(200, 255, 0, 0.4)" : "rgba(6, 182, 212, 0.3)";

        for (let x = 0; x < width; x += 15) {
          const y =
            height / 2 +
            Math.sin(x * 0.01 + step + i) * (30 + i * 15) +
            Math.cos(x * 0.005 + step * 0.5) * 20;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // Floating light particles
      for (let p = 0; p < 25; p++) {
        const px = (Math.sin(p * 99 + step * 0.5) * 0.5 + 0.5) * width;
        const py = (Math.cos(p * 33 + step * 0.8) * 0.5 + 0.5) * height;
        const radius = Math.abs(Math.sin(p + step)) * 3 + 1;

        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fillStyle = p % 3 === 0 ? "#c8ff00" : "#38bdf8";
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#c8ff00";
        ctx.fill();
      }

      // Scanning line grid overlay effect
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      for (let y = 0; y < height; y += 4) {
        ctx.fillRect(0, y, width, 1);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying]);

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section aria-label="Hero Section" className="w-full py-12 md:py-24 lg:py-28 bg-background relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-accent/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="container px-4 md:px-6 max-w-7xl mx-auto relative z-10">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12 items-center">
          
          {/* Left Hero Text Column */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs bg-surface text-muted border-border py-1 px-2.5">
                <span className="mr-2 h-2 w-2 rounded-full bg-accent animate-pulse" aria-hidden="true" />
                Vanta Engine v2.4 Active
              </Badge>
              <Badge variant="secondary" className="font-mono text-xs py-1 px-2.5 bg-accent/10 text-accent border border-accent/30">
                ⚡ Realtime AI Video Render
              </Badge>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl xl:text-6xl/none text-foreground">
                Turn Ideas Into <br />
                <span className="text-gradient-accent">Cinematic Video</span>
              </h1>
              <p className="max-w-[600px] text-muted md:text-lg leading-relaxed">
                The ultimate multi-model AI video workspace. Command industry-leading generation models with precision motion engineering and studio-grade controls.
              </p>
            </div>

            <div className="flex flex-col gap-3 min-[400px]:flex-row pt-2">
              <Button asChild className="bg-accent text-accent-foreground hover:bg-accent-hover font-bold h-12 px-6 text-sm shadow-[0_0_20px_rgba(200,255,0,0.2)]" size="lg">
                <Link href="/auth?mode=signup">
                  Start Creating <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-border text-foreground hover:bg-surface font-semibold h-12 px-6 text-sm">
                <a href="#community" onClick={(e) => handleScroll(e, "#community")}>
                  Explore Generations
                </a>
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/60 text-xs font-mono">
              <div>
                <div className="text-muted text-[10px] uppercase">MODELS</div>
                <div className="font-bold text-foreground">Nova, Motion X</div>
              </div>
              <div>
                <div className="text-muted text-[10px] uppercase">LATENCY</div>
                <div className="font-bold text-accent">&lt; 3.2s Ultra Fast</div>
              </div>
              <div>
                <div className="text-muted text-[10px] uppercase">QUALITY</div>
                <div className="font-bold text-foreground">4K UHD 60FPS</div>
              </div>
            </div>
          </div>

          {/* Right Hero Video Canvas Preview Column */}
          <div className="lg:col-span-6 flex items-center justify-center">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-accent/40 bg-surface shadow-[0_0_35px_rgba(200,255,0,0.12)] group">
              {/* Canvas animated video stream */}
              <canvas ref={canvasRef} className="w-full h-full object-cover block" />

              {/* Animated HUD Overlay */}
              <div className="absolute inset-0 flex flex-col justify-between p-5 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none">
                
                {/* Top HUD Header */}
                <div className="flex items-center justify-between pointer-events-auto">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-accent animate-ping" />
                    <span className="font-mono text-[10px] font-bold tracking-wider text-accent uppercase">
                      LIVE RENDER · NOVA VIDEO PRO
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px] bg-black/60 text-foreground border-border">
                      {currentTime.toFixed(2)}s / 8.00s
                    </Badge>
                  </div>
                </div>

                {/* Center Interactive Play / Pause Button */}
                <div className="flex justify-center items-center pointer-events-auto">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="h-16 w-16 rounded-full bg-accent/90 hover:bg-accent text-accent-foreground flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer"
                    aria-label={isPlaying ? "Pause video" : "Play video"}
                  >
                    {isPlaying ? (
                      <Pause className="h-7 w-7 fill-current" />
                    ) : (
                      <Play className="h-7 w-7 fill-current ml-1" />
                    )}
                  </button>
                </div>

                {/* Bottom Prompt Overlay Banner */}
                <div className="space-y-2 pointer-events-auto">
                  <div className="flex items-center justify-between text-[10px] font-mono text-muted">
                    <span className="flex items-center gap-1 text-accent">
                      <Sparkles className="h-3 w-3" /> PROMPT #{activePromptIdx + 1}
                    </span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-emerald-400" /> COMMERCIAL LICENSED
                    </span>
                  </div>

                  <div className="rounded-xl bg-black/70 backdrop-blur-md p-3.5 border border-white/10 transition-all">
                    <p className="text-xs text-foreground/95 leading-relaxed font-sans line-clamp-2">
                      {HERO_PROMPTS[activePromptIdx]}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
