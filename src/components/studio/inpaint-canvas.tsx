"use client";

import * as React from "react";
import { Brush, Eraser, RotateCcw, Trash2, Undo } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InpaintCanvasProps {
  imageSrc: string;
  onMaskChange?: (maskBase64: string) => void;
}

export function InpaintCanvas({ imageSrc, onMaskChange }: InpaintCanvasProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [brushSize, setBrushSize] = React.useState(30);
  const [isErasing, setIsErasing] = React.useState(false);
  const [isDrawing, setIsDrawing] = React.useState(false);

  const initCanvas = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      canvas.width = img.width || 800;
      canvas.height = img.height || 600;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [imageSrc]);

  React.useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas && onMaskChange) {
      onMaskChange(canvas.toDataURL("image/png"));
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.lineWidth = brushSize * scaleX;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (isErasing) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, (brushSize * scaleX) / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "rgba(200, 255, 0, 0.6)"; // Neon lime semi-transparent brush
      ctx.fillStyle = "rgba(200, 255, 0, 0.6)";
      ctx.beginPath();
      ctx.arc(x, y, (brushSize * scaleX) / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (onMaskChange) onMaskChange("");
    }
  };

  return (
    <div className="space-y-3 font-sans">
      {/* Brush Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface rounded-xl border border-border text-xs font-mono">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsErasing(false)}
            className={`p-2 rounded-lg border flex items-center gap-1.5 font-bold transition-all ${
              !isErasing
                ? "bg-accent/15 text-accent border-accent/40"
                : "bg-background border-border text-muted"
            }`}
          >
            <Brush className="h-3.5 w-3.5" /> Mask Brush
          </button>
          <button
            onClick={() => setIsErasing(true)}
            className={`p-2 rounded-lg border flex items-center gap-1.5 font-bold transition-all ${
              isErasing
                ? "bg-accent/15 text-accent border-accent/40"
                : "bg-background border-border text-muted"
            }`}
          >
            <Eraser className="h-3.5 w-3.5" /> Eraser
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-muted text-[10px]">BRUSH SIZE: {brushSize}px</span>
          <input
            type="range"
            min={5}
            max={100}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-24 accent-[#c8ff00] cursor-pointer"
          />
          <Button size="sm" variant="outline" onClick={handleClear} className="h-8 text-xs font-mono border-border">
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear Mask
          </Button>
        </div>
      </div>

      {/* Interactive Mask Overlay Canvas */}
      <div
        ref={containerRef}
        className="relative w-full max-h-[500px] aspect-video rounded-2xl border border-border bg-background overflow-hidden flex items-center justify-center"
      >
        <img src={imageSrc} alt="Source for inpainting" className="w-full h-full object-contain pointer-events-none" />
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="absolute inset-0 w-full h-full object-contain cursor-crosshair z-10"
        />
      </div>
    </div>
  );
}
