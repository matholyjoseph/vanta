import { db } from "@/lib/db";

export interface ExportFilmResult {
  exportAssetId: string;
  url: string;
  durationSeconds: number;
}

export interface ExportFilmService {
  exportProjectFilm(projectId: string, userId: string): Promise<ExportFilmResult>;
}

export class DevelopmentExportFilmService implements ExportFilmService {
  async exportProjectFilm(projectId: string, userId: string): Promise<ExportFilmResult> {
    const project = await db.project.findFirst({
      where: { id: projectId, userId },
      include: {
        scenes: {
          include: {
            shots: true,
          },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!project) {
      throw new Error("Project not found or access denied.");
    }

    // Collect all shots across scenes
    let totalShotsCount = 0;
    for (const scene of project.scenes) {
      totalShotsCount += scene.shots.length;
    }

    const estimatedDuration = Math.max(4, totalShotsCount * 4);

    // Create compiled output Asset in DB linked to user
    const asset = await db.asset.create({
      data: {
        userId,
        name: `Exported Film — ${project.name}`,
        type: "video",
        url: "/placeholder-video.mp4",
        resolution: "1920x1080",
        duration: `00:${estimatedDuration < 10 ? "0" : ""}${estimatedDuration}`,
        sizeBytes: estimatedDuration * 5000000,
      },
    });

    return {
      exportAssetId: asset.id,
      url: asset.url,
      durationSeconds: estimatedDuration,
    };
  }
}

export const exportFilmService = new DevelopmentExportFilmService();
