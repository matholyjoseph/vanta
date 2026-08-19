"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { uploadMediaAction } from "@/app/actions/dashboard";
import { useToast } from "@/components/ui/toast";
import { Upload, FileVideo, Image as ImageIcon, Music, Loader2, Check } from "lucide-react";

interface UploadMediaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadMediaModal({ open, onOpenChange }: UploadMediaModalProps) {
  const { showToast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const MAX_SIZE = 100 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        setError("File size exceeds 100MB limit.");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      await uploadMediaAction(formData);

      showToast(`Asset "${selectedFile.name}" uploaded successfully!`, "success");
      setSelectedFile(null);
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-surface border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            Upload Media Asset
          </DialogTitle>
          <DialogDescription className="text-muted text-sm mt-1">
            Upload video clips, character images, or audio tracks to your Vanta library.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleUpload} className="space-y-5 pt-2">
          {/* Dropzone container */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
              selectedFile
                ? "border-accent/80 bg-accent/5"
                : "border-border hover:border-accent/40 bg-background/50 hover:bg-background"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept="video/mp4,video/webm,image/png,image/jpeg,image/webp,audio/mpeg,audio/wav"
              className="hidden"
            />

            {selectedFile ? (
              <div className="space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-accent/20 text-accent flex items-center justify-center">
                  <Check className="h-6 w-6" />
                </div>
                <div className="font-semibold text-foreground text-sm truncate max-w-xs mx-auto">
                  {selectedFile.name}
                </div>
                <div className="text-xs text-muted font-mono">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · {selectedFile.type}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center text-muted">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Click to select file or drag & drop
                  </p>
                  <p className="text-xs text-muted mt-1">
                    MP4, WEBM, PNG, JPG, or MP3 (Max 100MB)
                  </p>
                </div>
                <div className="flex justify-center gap-4 text-xs text-muted pt-1">
                  <span className="flex items-center gap-1">
                    <FileVideo className="h-3.5 w-3.5 text-accent" /> Video
                  </span>
                  <span className="flex items-center gap-1">
                    <ImageIcon className="h-3.5 w-3.5 text-accent" /> Image
                  </span>
                  <span className="flex items-center gap-1">
                    <Music className="h-3.5 w-3.5 text-accent" /> Audio
                  </span>
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="flex-1 bg-accent text-accent-foreground font-bold"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload Asset"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
