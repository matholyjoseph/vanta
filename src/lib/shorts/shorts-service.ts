import { db } from "@/lib/db";
import { shortsHighlightAnalyzer } from "@/lib/shorts/shorts-highlight-analyzer";
import { shortsHookService } from "@/lib/shorts/shorts-hook-service";
import { shortsReframeService } from "@/lib/shorts/shorts-reframe-service";
import { getStorageProvider } from "@/lib/storage";

export class ShortsService {
  public async createShortsProject(userId: string, params: { name?: string; sourceAssetId?: string }) {
    let sourceAsset = null;
    if (params.sourceAssetId) {
      sourceAsset = await db.asset.findUnique({ where: { id: params.sourceAssetId } });
    }

    const name = params.name || sourceAsset?.name || "Untitled Shorts Project";

    // Default Transcript Segments if creating fresh
    const defaultTranscript = [
      { id: "seg_1", startTime: 0, endTime: 6, text: "Welcome to this episode. Today we're revealing how top creators build viral video content.", speaker: "Host" },
      { id: "seg_2", startTime: 6, endTime: 14, text: "You've been doing this wrong the whole time. The secret isn't flashiness, it's immediate hook clarity.", speaker: "Guest" },
      { id: "seg_3", startTime: 14, endTime: 22, text: "When you analyze 10,000 viral shorts, the first 3 seconds determine 90% of your audience retention.", speaker: "Guest" },
      { id: "seg_4", startTime: 22, endTime: 30, text: "That single realization changed our entire production strategy and doubled our engagement overnight.", speaker: "Host" },
    ];

    const project = await db.shortsProject.create({
      data: {
        userId,
        sourceAssetId: params.sourceAssetId || null,
        name,
        status: "TRANSCRIBING",
        sourceDuration: 30,
        transcriptJson: JSON.stringify(defaultTranscript),
        targetPlatform: "GENERIC_9_16",
        targetAspectRatio: "9:16",
      },
    });

    // Run chunked highlight detection
    await this.analyzeProjectHighlights(project.id, defaultTranscript);

    return project;
  }

  public async analyzeProjectHighlights(shortsProjectId: string, segments: any[]) {
    const highlights = await shortsHighlightAnalyzer.analyzeHighlights(shortsProjectId, segments);

    // Save candidates to DB
    await db.highlightCandidate.deleteMany({ where: { shortsProjectId } });

    for (const h of highlights) {
      await db.highlightCandidate.create({
        data: {
          shortsProjectId,
          startTime: h.startTime,
          endTime: h.endTime,
          title: h.title,
          summary: h.summary,
          suggestedHook: h.suggestedHook,
          score: h.score,
          reasonSummary: h.reasonSummary,
          category: h.category,
          status: "SUGGESTED",
        },
      });
    }

    // Create default short clips for top candidates
    const topCandidates = await db.highlightCandidate.findMany({
      where: { shortsProjectId },
      take: 3,
    });

    for (const cand of topCandidates) {
      const reframe = shortsReframeService.computeReframe("AUTO_REFRAME", cand.endTime - cand.startTime);

      await db.shortClip.create({
        data: {
          shortsProjectId,
          highlightCandidateId: cand.id,
          name: cand.title,
          sourceStart: cand.startTime,
          sourceEnd: cand.endTime,
          duration: cand.endTime - cand.startTime,
          hookText: cand.suggestedHook,
          reframeMode: "AUTO_REFRAME",
          cropKeyframes: JSON.stringify(reframe.cropKeyframes),
          status: "READY",
        },
      });
    }

    const updated = await db.shortsProject.update({
      where: { id: shortsProjectId },
      data: { status: "HIGHLIGHTS_READY" },
    });

    return updated;
  }

  public async batchExportShorts(shortsProjectId: string, clipIds: string[], platforms: string[]) {
    const clips = await db.shortClip.findMany({
      where: { id: { in: clipIds }, shortsProjectId },
    });

    const sampleUrl = "/werewolf_cinematic_preview.jpg";
    const exportedAssets: any[] = [];

    for (const clip of clips) {
      for (const platform of platforms) {
        const exportRecord = await db.shortExport.create({
          data: {
            shortClipId: clip.id,
            platform,
            status: "RENDERING",
            resolution: "1080x1920",
            aspectRatio: "9:16",
          },
        });

        // Index exported short in VANTA Asset Library
        const asset = await db.asset.create({
          data: {
            userId: (await db.shortsProject.findUnique({ where: { id: shortsProjectId } }))!.userId,
            type: "VIDEO",
            name: `${clip.name} - ${platform}`,
            url: sampleUrl,
            thumbnailUrl: sampleUrl,
            mimeType: "video/mp4",
            resolution: "1080x1920",
            duration: `${clip.duration}s`,
          },
        });

        await db.shortExport.update({
          where: { id: exportRecord.id },
          data: { status: "COMPLETED", assetId: asset.id, completedAt: new Date() },
        });

        exportedAssets.push(asset);
      }
    }

    await db.shortsProject.update({
      where: { id: shortsProjectId },
      data: { status: "READY" },
    });

    return exportedAssets;
  }
}

export const shortsService = new ShortsService();
