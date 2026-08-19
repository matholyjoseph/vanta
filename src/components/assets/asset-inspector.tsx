"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  Download,
  Heart,
  Sparkles,
  X,
  Trash2,
  Undo2,
  FolderInput,
  Film,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  toggleFavoriteAssetAction,
  softDeleteAssetAction,
  restoreAssetAction,
} from "@/app/actions/assets";

export interface AssetItem {
  id: string;
  name: string;
  type: string;
  url: string;
  thumbnailUrl?: string | null;
  resolution?: string | null;
  duration?: string | null;
  sizeBytes: number;
  isFavorite: boolean;
  createdAt: Date;
  deletedAt?: Date | null;
  folder?: { id: string; name: string; color?: string | null } | null;
}

interface AssetInspectorProps {
  asset: AssetItem | null;
  onClose: () => void;
  onUpdate?: () => void;
  onRequestDeletePermanently?: (asset: AssetItem) => void;
}

export function AssetInspector({
  asset,
  onClose,
  onUpdate,
  onRequestDeletePermanently,
}: AssetInspectorProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const isFavorited = !!asset?.isFavorite;

  if (!asset) {
    return (
      <aside className="w-80 border-l border-border bg-[#09090b] flex flex-col items-center justify-center p-6 text-center text-muted hidden xl:flex">
        <div className="mx-auto w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center mb-3">
          <Film className="h-5 w-5 opacity-40" />
        </div>
        <p className="text-sm font-semibold text-foreground">No Asset Selected</p>
        <p className="text-xs text-muted mt-1 max-w-xs">
          Select an asset from the gallery to inspect parameters, download, remix, or manage.
        </p>
      </aside>
    );
  }

  const isTrash = !!asset.deletedAt;

  const handleToggleFavorite = async () => {
    try {
      await toggleFavoriteAssetAction(asset.id);
      showToast(isFavorited ? "Removed from favorites" : "Added to favorites", "success");
      if (onUpdate) onUpdate();
    } catch {
      showToast("Failed to update favorite status", "error");
    }
  };

  const handleSoftDelete = async () => {
    try {
      await softDeleteAssetAction(asset.id);
      showToast(`Moved "${asset.name}" to Trash`, "info");
      onClose();
      if (onUpdate) onUpdate();
    } catch {
      showToast("Failed to move asset to Trash", "error");
    }
  };

  const handleRestore = async () => {
    try {
      await restoreAssetAction(asset.id);
      showToast(`Restored "${asset.name}" from Trash`, "success");
      onClose();
      if (onUpdate) onUpdate();
    } catch {
      showToast("Failed to restore asset", "error");
    }
  };

  const handleUseAsReference = () => {
    router.push(`/studio/video?mode=image-to-video&referenceAssetId=${asset.id}`);
  };

  const handleRemix = () => {
    router.push(`/studio/video?prompt=${encodeURIComponent(asset.name)}`);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <aside className="w-96 border-l border-border bg-[#09090b] flex flex-col h-full overflow-y-auto shrink-0 hidden xl:flex">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-bold text-sm text-foreground tracking-tight">
          Asset Inspector
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={handleToggleFavorite}
            className={`p-1.5 rounded-lg hover:bg-surface transition-colors ${
              isFavorited ? "text-red-500" : "text-muted hover:text-foreground"
            }`}
            title="Favorite asset"
          >
            <Heart className="h-4 w-4 fill-current" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors"
            title="Close inspector"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Preview Container */}
        <div className="relative aspect-video w-full rounded-xl bg-background border border-border overflow-hidden flex items-center justify-center group shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 via-surface to-background" />

          <button className="relative z-10 w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:scale-110 transition-transform cursor-pointer">
            <Play className="h-5 w-5 fill-white ml-0.5" />
          </button>

          <span className="absolute bottom-2 right-2 font-mono text-[10px] bg-black/80 px-1.5 py-0.5 rounded text-foreground">
            {asset.duration || "00:04"}
          </span>
        </div>

        {/* Title & Type Badge */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="font-mono text-[10px] text-accent border-accent/30">
              {asset.type}
            </Badge>
            {asset.folder && (
              <span className="text-[10px] font-mono text-muted flex items-center gap-1">
                <FolderInput className="h-3 w-3" /> {asset.folder.name}
              </span>
            )}
          </div>
          <h3 className="font-bold text-base text-foreground leading-snug">
            {asset.name}
          </h3>
        </div>

        {/* Action Buttons Row */}
        {isTrash ? (
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleRestore}
              className="text-xs font-semibold"
            >
              <Undo2 className="mr-1.5 h-3.5 w-3.5" /> Restore
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onRequestDeletePermanently && onRequestDeletePermanently(asset)}
              className="text-xs font-semibold text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete Forever
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleUseAsReference}
              className="text-xs font-semibold"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-accent" /> Use Reference
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleRemix}
              className="text-xs font-semibold"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Remix
            </Button>
          </div>
        )}

        {/* Metadata Grid */}
        <div className="space-y-2 pt-2">
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
            Asset Metadata
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg border border-border bg-surface space-y-1">
              <div className="text-[10px] text-muted uppercase">RESOLUTION</div>
              <div className="font-bold text-foreground">
                {asset.resolution || "1920x1080"}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border bg-surface space-y-1">
              <div className="text-[10px] text-muted uppercase">DURATION</div>
              <div className="font-bold text-foreground">
                {asset.duration || "00:04"}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border bg-surface space-y-1">
              <div className="text-[10px] text-muted uppercase">FILE SIZE</div>
              <div className="font-bold text-foreground">
                {formatFileSize(asset.sizeBytes)}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border bg-surface space-y-1">
              <div className="text-[10px] text-muted uppercase">CREATED</div>
              <div className="font-bold text-foreground truncate">
                {new Date(asset.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Download & Soft Delete CTAs */}
        {!isTrash && (
          <div className="space-y-2 pt-2">
            <Button
              variant="outline"
              asChild
              className="w-full text-xs font-semibold justify-center border-border hover:bg-surface"
            >
              <a href={asset.url} download={asset.name}>
                <Download className="mr-2 h-4 w-4 text-accent" /> Download File Asset
              </a>
            </Button>

            <Button
              variant="ghost"
              onClick={handleSoftDelete}
              className="w-full text-xs text-destructive hover:bg-destructive/10 justify-center"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Move to Trash
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
