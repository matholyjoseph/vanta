import { db } from "@/lib/db";

export interface UserPresence {
  userId: string;
  name: string;
  avatar?: string;
  status: "VIEWING" | "EDITING" | "REVIEWING";
  lastSeenMs: number;
}

class PresenceService {
  private activePresence = new Map<string, Map<string, UserPresence>>();

  /**
   * Touches active presence for a project.
   */
  public touchPresence(projectId: string, user: { userId: string; name: string; avatar?: string }, status: "VIEWING" | "EDITING" | "REVIEWING") {
    if (!this.activePresence.has(projectId)) {
      this.activePresence.set(projectId, new Map());
    }

    const projectPresence = this.activePresence.get(projectId)!;
    projectPresence.set(user.userId, {
      userId: user.userId,
      name: user.name,
      avatar: user.avatar,
      status,
      lastSeenMs: Date.now(),
    });
  }

  /**
   * Returns active viewing/editing users for a project (expires after 30 seconds).
   */
  public getActivePresence(projectId: string): UserPresence[] {
    const projectPresence = this.activePresence.get(projectId);
    if (!projectPresence) return [];

    const now = Date.now();
    const active: UserPresence[] = [];

    projectPresence.forEach((p, userId) => {
      if (now - p.lastSeenMs < 30000) {
        active.push(p);
      } else {
        projectPresence.delete(userId);
      }
    });

    return active;
  }

  /**
   * Conflict check: Compares expected revision number against database revision number.
   */
  public async checkRevisionConflict(projectId: string, expectedRevision: number): Promise<{ conflict: boolean; currentRevision: number }> {
    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) return { conflict: false, currentRevision: 1 };

    const currentRevision = project.revisionNumber || 1;
    return {
      conflict: currentRevision !== expectedRevision,
      currentRevision,
    };
  }
}

export const presenceService = new PresenceService();
