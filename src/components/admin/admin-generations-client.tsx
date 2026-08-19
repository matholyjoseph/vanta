"use client";

import * as React from "react";
import {
  Film,
  Search,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Clock,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  refundGenerationAdminAction,
  getAdminGenerationsAction,
} from "@/app/actions/admin-actions";

interface GenerationItem {
  id: string;
  userId: string;
  modelId: string;
  mode: string;
  prompt: string;
  negativePrompt?: string | null;
  status: string;
  progress: number;
  resolution: string;
  duration: string;
  aspectRatio: string;
  creditCost: number;
  providerJobId?: string | null;
  errorMessage?: string | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  createdAt: Date | string;
  completedAt?: Date | string | null;
  user?: { id: string; name: string | null; email: string | null } | null;
  model?: { name: string; provider?: { name: string; slug: string } | null } | null;
}

interface AdminGenerationsClientProps {
  initialGenerations: GenerationItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export function AdminGenerationsClient({
  initialGenerations,
  totalCount,
  totalPages,
  currentPage,
}: AdminGenerationsClientProps) {
  const { showToast } = useToast();

  const [generations, setGenerations] = React.useState<GenerationItem[]>(initialGenerations);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [selectedGen, setSelectedGen] = React.useState<GenerationItem | null>(null);
  const [refundReason, setRefundReason] = React.useState("");
  const [refundSubmitting, setRefundSubmitting] = React.useState(false);

  // Failure Stats Calculation
  const failedCount = generations.filter((g) => g.status === "FAILED").length;
  const failureRate = totalCount > 0 ? ((failedCount / totalCount) * 100).toFixed(1) : "0.0";

  // Filtered Generations
  const filteredGenerations = generations.filter((g) => {
    const matchSearch =
      !search ||
      g.prompt.toLowerCase().includes(search.toLowerCase()) ||
      g.id.includes(search) ||
      (g.user?.email || "").toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === "ALL" || g.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const handleRefundCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGen || !refundReason.trim()) return;

    setRefundSubmitting(true);
    try {
      await refundGenerationAdminAction(selectedGen.id, refundReason.trim());
      showToast(`Refunded ${selectedGen.creditCost} credits to user wallet!`, "success");
      setRefundReason("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to refund credits";
      showToast(msg, "error");
    } finally {
      setRefundSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Film className="h-6 w-6 text-accent" /> Platform Generation Monitoring
          </h1>
          <p className="text-xs text-muted mt-1 font-mono">
            {totalCount} total render jobs executed across all AI engines.
          </p>
        </div>

        {/* Quick Failure Rate KPI */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-destructive/10 border border-destructive/30 text-xs font-mono">
            <span className="text-muted mr-1.5">FAILURE RATE:</span>
            <span className="font-bold text-destructive">{failureRate}%</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface p-4 rounded-2xl border border-border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompt, ID, user email..."
            className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Fast Failure Toggle */}
          <Button
            size="sm"
            variant={statusFilter === "FAILED" ? "destructive" : "outline"}
            onClick={() => setStatusFilter(statusFilter === "FAILED" ? "ALL" : "FAILED")}
            className="h-9 text-xs font-mono"
          >
            <AlertCircle className="mr-1.5 h-3.5 w-3.5" /> Failures Only ({failedCount})
          </Button>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-background border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="GENERATING">Generating</option>
            <option value="QUEUED">Queued</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-background border-b border-border text-muted uppercase text-[10px]">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">User</th>
                <th className="p-4">Model & Provider</th>
                <th className="p-4">Status</th>
                <th className="p-4">Prompt</th>
                <th className="p-4">Credits</th>
                <th className="p-4">Created</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredGenerations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted">
                    No generations match filter criteria.
                  </td>
                </tr>
              ) : (
                filteredGenerations.map((gen) => (
                  <tr
                    key={gen.id}
                    onClick={() => setSelectedGen(gen)}
                    className="hover:bg-surface-hover transition-colors cursor-pointer"
                  >
                    <td className="p-4 font-bold text-accent font-mono text-[11px]">
                      {gen.id.slice(0, 10)}...
                    </td>
                    <td className="p-4 text-muted font-sans font-semibold">
                      {gen.user?.email || "Anonymous"}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-foreground">{gen.model?.name || gen.modelId}</div>
                      <div className="text-[10px] text-muted">{gen.resolution} • {gen.duration}</div>
                    </td>
                    <td className="p-4">
                      {gen.status === "COMPLETED" && (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                          Completed
                        </Badge>
                      )}
                      {gen.status === "FAILED" && (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-[10px]">
                          Failed
                        </Badge>
                      )}
                      {(gen.status === "GENERATING" || gen.status === "PROCESSING") && (
                        <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30 text-[10px] animate-pulse">
                          Generating {gen.progress}%
                        </Badge>
                      )}
                      {gen.status === "QUEUED" && (
                        <Badge variant="outline" className="bg-surface text-muted border-border text-[10px]">
                          Queued
                        </Badge>
                      )}
                    </td>
                    <td className="p-4 text-foreground/90 font-sans italic truncate max-w-xs">
                      &ldquo;{gen.prompt}&rdquo;
                    </td>
                    <td className="p-4 font-bold text-accent">{gen.creditCost} CR</td>
                    <td className="p-4 text-muted">
                      {new Date(gen.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedGen(gen)}
                        className="h-8 text-[11px] font-mono border-border"
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generation Inspection Detail Modal */}
      {selectedGen && (
        <Dialog open={!!selectedGen} onOpenChange={() => setSelectedGen(null)}>
          <DialogContent className="max-w-2xl bg-surface border-border text-foreground font-sans">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="text-lg font-bold flex items-center justify-between">
                <span>Generation Detail — {selectedGen.id}</span>
                <Badge variant="outline" className="text-xs font-mono text-accent border-accent/30">
                  {selectedGen.status}
                </Badge>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {/* Media Player if Completed */}
              {selectedGen.status === "COMPLETED" && selectedGen.videoUrl ? (
                <div className="aspect-video w-full rounded-xl bg-background border border-border overflow-hidden relative">
                  <video src={selectedGen.videoUrl} controls loop className="w-full h-full object-cover" />
                </div>
              ) : selectedGen.status === "FAILED" ? (
                <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 space-y-1">
                  <div className="font-mono text-xs font-bold text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> Generation Error
                  </div>
                  <p className="text-xs text-foreground font-mono">{selectedGen.errorMessage || "Unknown provider error."}</p>
                </div>
              ) : null}

              {/* Prompt Text */}
              <div className="space-y-1">
                <div className="text-[10px] font-mono uppercase text-muted">Prompt</div>
                <div className="p-3 bg-background rounded-xl border border-border text-xs leading-relaxed italic">
                  &ldquo;{selectedGen.prompt}&rdquo;
                </div>
              </div>

              {/* Parameter Grid */}
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="p-3 bg-background rounded-xl border border-border">
                  <div className="text-[10px] text-muted">MODEL</div>
                  <div className="font-bold text-accent">{selectedGen.model?.name || selectedGen.modelId}</div>
                </div>
                <div className="p-3 bg-background rounded-xl border border-border">
                  <div className="text-[10px] text-muted">RESOLUTION</div>
                  <div className="font-bold">{selectedGen.resolution}</div>
                </div>
                <div className="p-3 bg-background rounded-xl border border-border">
                  <div className="text-[10px] text-muted">DURATION</div>
                  <div className="font-bold">{selectedGen.duration}</div>
                </div>
              </div>

              {/* Refund Credits Form */}
              <form onSubmit={handleRefundCredits} className="p-4 bg-background rounded-xl border border-border space-y-3">
                <div className="text-xs font-mono font-bold text-foreground flex items-center justify-between">
                  <span>Refund Customer Credits</span>
                  <span className="text-accent">{selectedGen.creditCost} CREDITS</span>
                </div>
                <input
                  type="text"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Reason for refunding credits to customer..."
                  className="w-full bg-surface border border-border rounded-xl p-2 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
                  required
                />
                <Button type="submit" disabled={refundSubmitting} size="sm" className="bg-accent text-accent-foreground font-bold text-xs">
                  {refundSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refund Credits to User"}
                </Button>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
