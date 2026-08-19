"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  Search,
  Plus,
  LayoutGrid,
  List,
  Heart,
  Trash2,
  Sparkles,
  Film,
  Folder,
  ChevronLeft,
  ChevronRight,
  Play,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { NewFolderModal } from "@/components/assets/new-folder-modal";
import { AssetInspector, AssetItem } from "@/components/assets/asset-inspector";
import { useToast } from "@/components/ui/toast";
import {
  getAssetsAction,
  toggleFavoriteAssetAction,
  softDeleteAssetAction,
  restoreAssetAction,
  permanentDeleteAssetAction,
  emptyTrashAction,
} from "@/app/actions/assets";

export interface FolderItem {
  id: string;
  name: string;
  color?: string | null;
  _count?: { assets: number };
}

interface AssetLibraryClientProps {
  initialAssets: AssetItem[];
  initialTotalCount: number;
  initialFolders: FolderItem[];
}

export function AssetLibraryClient({
  initialAssets,
  initialTotalCount,
  initialFolders,
}: AssetLibraryClientProps) {
  const router = useRouter();
  const { showToast } = useToast();

  // Navigation & Filter State
  const [sidebarSection, setSidebarSection] = React.useState<"all" | "recent" | "favorites" | "trash" | "folder">("all");
  const [activeFolderId, setActiveFolderId] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<string>("all");

  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [typeFilter] = React.useState<string>("ALL");
  const [sortBy, setSortBy] = React.useState<"newest" | "oldest" | "name">("newest");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");

  // Assets Data State
  const [assets, setAssets] = React.useState<AssetItem[]>(initialAssets);
  const [totalCount, setTotalCount] = React.useState<number>(initialTotalCount);
  const [page, setPage] = React.useState<number>(1);
  const [pageSize] = React.useState<number>(24);

  const [folders] = React.useState<FolderItem[]>(initialFolders);
  const [selectedAsset, setSelectedAsset] = React.useState<AssetItem | null>(
    initialAssets.length > 0 ? initialAssets[0] : null
  );

  // Modals state
  const [newFolderOpen, setNewFolderOpen] = React.useState<boolean>(false);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = React.useState<AssetItem | null>(null);
  const [emptyTrashConfirmOpen, setEmptyTrashConfirmOpen] = React.useState<boolean>(false);
  const [activeMobilePanel, setActiveMobilePanel] = React.useState<"folders" | "inspector" | null>(null);

  // Trigger fetch when parameters change
  React.useEffect(() => {
    let isSubscribed = true;
    getAssetsAction({
      tab: activeTab,
      sidebarSection,
      folderId: activeFolderId || undefined,
      searchQuery,
      typeFilter,
      sortBy,
      page,
      pageSize,
    })
      .then((res) => {
        if (isSubscribed) {
          setAssets(res.assets as AssetItem[]);
          setTotalCount(res.totalCount);
        }
      })
      .catch(() => {
        if (isSubscribed) showToast("Failed to fetch assets", "error");
      });

    return () => {
      isSubscribed = false;
    };
  }, [activeTab, sidebarSection, activeFolderId, searchQuery, typeFilter, sortBy, page, pageSize, showToast]);

  // Favorite toggle handler
  const handleToggleFavorite = async (assetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleFavoriteAssetAction(assetId);
      setAssets((prev) =>
        prev.map((a) => (a.id === assetId ? { ...a, isFavorite: !a.isFavorite } : a))
      );
      showToast("Favorite status updated", "success");
    } catch {
      showToast("Failed to update favorite status", "error");
    }
  };

  // Soft Delete handler
  const handleSoftDelete = async (assetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await softDeleteAssetAction(assetId);
      setAssets((prev) => prev.filter((a) => a.id !== assetId));
      showToast("Moved asset to Trash", "info");
      if (selectedAsset?.id === assetId) setSelectedAsset(null);
    } catch {
      showToast("Failed to delete asset", "error");
    }
  };

  // Restore handler
  const handleRestore = async (assetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await restoreAssetAction(assetId);
      setAssets((prev) => prev.filter((a) => a.id !== assetId));
      showToast("Restored asset from Trash", "success");
      if (selectedAsset?.id === assetId) setSelectedAsset(null);
    } catch {
      showToast("Failed to restore asset", "error");
    }
  };

  // Permanent Delete handler
  const handlePermanentDelete = async () => {
    if (!permanentDeleteTarget) return;
    try {
      await permanentDeleteAssetAction(permanentDeleteTarget.id);
      setAssets((prev) => prev.filter((a) => a.id !== permanentDeleteTarget.id));
      showToast("Asset permanently deleted", "info");
      setPermanentDeleteTarget(null);
      if (selectedAsset?.id === permanentDeleteTarget.id) setSelectedAsset(null);
    } catch {
      showToast("Failed to permanently delete asset", "error");
    }
  };

  // Empty Trash handler
  const handleEmptyTrash = async () => {
    try {
      await emptyTrashAction();
      setAssets([]);
      setTotalCount(0);
      showToast("Trash emptied successfully", "info");
      setEmptyTrashConfirmOpen(false);
      setSelectedAsset(null);
    } catch {
      showToast("Failed to empty trash", "error");
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="h-full flex flex-col bg-background text-foreground overflow-hidden">
      {/* 3-Column Studio Layout */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden min-h-0">
        {/* Column 1: Left Assets Navigation Sidebar */}
        <div className="col-span-3 border-r border-border p-4 space-y-6 bg-[#09090b] overflow-y-auto flex flex-col justify-between hidden lg:flex">
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-sm text-foreground tracking-tight flex items-center gap-2 mb-3">
                <FolderKanban className="h-4 w-4 text-accent" /> Asset Navigation
              </h2>

              <div className="space-y-1 text-xs font-mono">
                {[
                  { id: "all", label: "All Assets", icon: Film },
                  { id: "recent", label: "Recent Generations", icon: Sparkles },
                  { id: "favorites", label: "Favorites", icon: Heart },
                  { id: "trash", label: "Trash", icon: Trash2 },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = sidebarSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSidebarSection(item.id as "all" | "recent" | "favorites" | "trash" | "folder");
                        setActiveFolderId(null);
                        setPage(1);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${
                        isActive
                          ? "bg-surface-hover text-accent font-bold border border-accent/30"
                          : "text-muted hover:text-foreground hover:bg-surface"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4" /> {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Folders Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-muted">
                <span>FOLDERS ({folders.length})</span>
                <button
                  onClick={() => setNewFolderOpen(true)}
                  className="p-1 rounded bg-surface hover:bg-surface-hover border border-border text-foreground hover:text-accent transition-colors"
                  title="Create Folder"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-1 text-xs font-mono">
                {folders.map((folder) => {
                  const isActive = sidebarSection === "folder" && activeFolderId === folder.id;
                  return (
                    <button
                      key={folder.id}
                      onClick={() => {
                        setSidebarSection("folder");
                        setActiveFolderId(folder.id);
                        setPage(1);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${
                        isActive
                          ? "bg-surface-hover text-accent font-bold border border-accent/30"
                          : "text-muted hover:text-foreground hover:bg-surface"
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Folder className="h-4 w-4" style={{ color: folder.color || "#c8ff00" }} />
                        <span className="truncate">{folder.name}</span>
                      </span>
                      <span className="text-[10px] text-muted">{folder._count?.assets || 0}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Central Gallery Workspace */}
        <div className="col-span-12 lg:col-span-6 p-6 space-y-6 overflow-y-auto bg-background flex flex-col justify-between">
          <div className="space-y-6">
            {/* Header Title & Actions Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground capitalize">
                  {sidebarSection === "trash"
                    ? "Trash Bin"
                    : sidebarSection === "favorites"
                    ? "Favorites"
                    : sidebarSection === "folder"
                    ? "Folder View"
                    : "Asset Library"}
                </h1>
                <p className="text-xs text-muted mt-1">
                  {totalCount} {totalCount === 1 ? "asset" : "assets"} found in library.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Mobile Navigation Drawer Trigger */}
                <div className="flex lg:hidden items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveMobilePanel("folders")}
                    className="text-xs font-mono border-border"
                  >
                    Folders ({folders.length})
                  </Button>
                </div>

                {sidebarSection === "trash" && totalCount > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEmptyTrashConfirmOpen(true)}
                    className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Empty Trash
                  </Button>
                )}
              </div>
            </div>

            {/* Category Tabs Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {[
                { id: "all", label: "All" },
                { id: "videos", label: "Videos" },
                { id: "images", label: "Images" },
                { id: "audio", label: "Audio" },
                { id: "uploads", label: "Uploads" },
                { id: "characters", label: "Characters" },
                { id: "locations", label: "Locations" },
                { id: "references", label: "References" },
                { id: "favorites", label: "Favorites" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setPage(1);
                  }}
                  className={`py-1.5 px-3 rounded-xl text-xs font-mono font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? "bg-accent text-accent-foreground font-bold shadow-sm"
                      : "bg-surface text-muted hover:text-foreground border border-border"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Filter & View Controls Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search assets..."
                  className="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              {/* Controls Group */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end text-xs font-mono">
                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "name")}
                  className="bg-surface border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none text-xs"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name (A-Z)</option>
                </select>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-border">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1 rounded ${
                      viewMode === "grid" ? "bg-surface-hover text-accent" : "text-muted"
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-1 rounded ${
                      viewMode === "list" ? "bg-surface-hover text-accent" : "text-muted"
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Asset Cards Grid or List */}
            {assets.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-12 text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center text-muted">
                  <Film className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-foreground">No Assets Found</h3>
                <p className="text-xs text-muted max-w-xs mx-auto">
                  {sidebarSection === "trash"
                    ? "Trash is empty."
                    : "Generations created in Studio automatically appear in your Asset Library."}
                </p>
              </div>
            ) : viewMode === "grid" ? (
              /* GRID VIEW */
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {assets.map((asset) => {
                  const isSelected = selectedAsset?.id === asset.id;
                  const isTrash = sidebarSection === "trash";

                  return (
                    <div
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset)}
                      className={`group relative overflow-hidden rounded-2xl border p-3 transition-all cursor-pointer space-y-2.5 ${
                        isSelected
                          ? "border-accent bg-accent/5 shadow-[0_0_20px_rgba(200,255,0,0.1)]"
                          : "border-border bg-surface hover:border-accent/40"
                      }`}
                    >
                      {/* Thumbnail Container */}
                      <div className="relative aspect-video w-full rounded-xl bg-background border border-border overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 via-surface to-background" />

                        <Play className="h-7 w-7 text-accent opacity-80 group-hover:scale-110 transition-transform relative z-10" />

                        <span className="absolute bottom-1.5 right-1.5 font-mono text-[9px] bg-black/80 px-1.5 py-0.5 rounded text-foreground z-10">
                          {asset.duration || "00:04"}
                        </span>

                        <button
                          onClick={(e) => handleToggleFavorite(asset.id, e)}
                          className={`absolute top-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-md z-10 transition-transform ${
                            asset.isFavorite ? "text-red-500 scale-110" : "text-white/60 hover:text-white"
                          }`}
                        >
                          <Heart className="h-3.5 w-3.5 fill-current" />
                        </button>
                      </div>

                      {/* Info & Badges */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="font-mono text-[9px] text-accent border-accent/30">
                            {asset.type}
                          </Badge>
                          <span className="text-[10px] font-mono text-muted">
                            {new Date(asset.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-foreground truncate group-hover:text-accent transition-colors">
                          {asset.name}
                        </h4>
                      </div>

                      {/* Card Actions Footer */}
                      <div className="flex items-center justify-between pt-1 border-t border-border/50 text-xs">
                        {isTrash ? (
                          <button
                            onClick={(e) => handleRestore(asset.id, e)}
                            className="text-accent hover:underline flex items-center gap-1 font-mono text-[10px]"
                          >
                            <RotateCcw className="h-3 w-3" /> Restore
                          </button>
                        ) : (
                          <button
                            onClick={(e) => handleSoftDelete(asset.id, e)}
                            className="text-muted hover:text-destructive p-1"
                            title="Move to Trash"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* LIST VIEW */
              <div className="space-y-2">
                {assets.map((asset) => {
                  const isSelected = selectedAsset?.id === asset.id;
                  return (
                    <div
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset)}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-4 transition-all cursor-pointer ${
                        isSelected
                          ? "border-accent bg-accent/5"
                          : "border-border bg-surface hover:border-accent/30"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-16 h-10 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
                          <Film className="h-4 w-4 text-accent" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-foreground truncate">
                            {asset.name}
                          </div>
                          <div className="text-[10px] font-mono text-muted flex items-center gap-2">
                            <span>{asset.type}</span>
                            <span>•</span>
                            <span>{asset.resolution || "1920x1080"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono text-muted shrink-0">
                        <span>{asset.duration || "00:04"}</span>
                        <span>{new Date(asset.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border text-xs font-mono text-muted">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="h-8 text-xs"
                >
                  <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="h-8 text-xs"
                >
                  Next <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Column 3: Right Asset Inspector Panel */}
        <AssetInspector
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onUpdate={() => router.refresh()}
          onRequestDeletePermanently={(asset) => setPermanentDeleteTarget(asset)}
        />
      </div>

      {/* Permanent Deletion Modal */}
      {permanentDeleteTarget && (
        <Dialog open={!!permanentDeleteTarget} onOpenChange={() => setPermanentDeleteTarget(null)}>
          <DialogContent className="max-w-md bg-surface border-border text-foreground">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Permanently Delete Asset?
              </DialogTitle>
              <DialogDescription className="text-muted text-sm mt-1">
                Are you sure you want to permanently delete &ldquo;{permanentDeleteTarget.name}&rdquo;? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setPermanentDeleteTarget(null)}>
                Cancel
              </Button>
              <Button onClick={handlePermanentDelete} className="bg-destructive text-white font-bold">
                Confirm Permanent Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Empty Trash Modal */}
      {emptyTrashConfirmOpen && (
        <Dialog open={emptyTrashConfirmOpen} onOpenChange={setEmptyTrashConfirmOpen}>
          <DialogContent className="max-w-md bg-surface border-border text-foreground">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Empty Trash Bin?
              </DialogTitle>
              <DialogDescription className="text-muted text-sm mt-1">
                All soft-deleted assets in the Trash will be permanently erased.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setEmptyTrashConfirmOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEmptyTrash} className="bg-destructive text-white font-bold">
                Confirm Empty Trash
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modals */}
      <NewFolderModal
        open={newFolderOpen}
        onOpenChange={setNewFolderOpen}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
