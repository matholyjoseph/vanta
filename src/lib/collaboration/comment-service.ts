import { db } from "@/lib/db";

export class CommentService {
  /**
   * Adds a comment to a target resource (Project, Scene, Shot, Timeline Timestamp).
   */
  public async addComment(authorId: string, data: {
    workspaceId: string;
    projectId?: string;
    targetType: string;
    targetId: string;
    timestampMs?: number; // e.g. 18420 for 00:18.420
    body: string;
    parentCommentId?: string;
  }) {
    // 1. Find or create CommentThread
    let thread = await db.commentThread.findFirst({
      where: {
        workspaceId: data.workspaceId,
        targetType: data.targetType,
        targetId: data.targetId,
        timestampMs: data.timestampMs ?? null,
      },
    });

    if (!thread) {
      thread = await db.commentThread.create({
        data: {
          workspaceId: data.workspaceId,
          projectId: data.projectId || null,
          targetType: data.targetType,
          targetId: data.targetId,
          timestampMs: data.timestampMs ?? null,
          status: "OPEN",
        },
      });
    }

    // 2. Create Comment
    const comment = await db.comment.create({
      data: {
        threadId: thread.id,
        workspaceId: data.workspaceId,
        projectId: data.projectId || null,
        authorId,
        parentCommentId: data.parentCommentId || null,
        body: data.body,
        status: "ACTIVE",
      },
    });

    // 3. Parse Mentions (@username or @email)
    const mentionMatches = data.body.match(/@([\w.-]+)/g);
    if (mentionMatches && mentionMatches.length > 0) {
      for (const m of mentionMatches) {
        const username = m.replace("@", "");
        const mentionedUser = await db.user.findFirst({
          where: { OR: [{ name: username }, { email: username }] },
        });
        if (mentionedUser) {
          await db.commentMention.create({
            data: {
              commentId: comment.id,
              userId: mentionedUser.id,
            },
          });
        }
      }
    }

    // Log Activity
    await db.workspaceActivity.create({
      data: {
        workspaceId: data.workspaceId,
        actorUserId: authorId,
        action: "comment.created",
        targetType: "Comment",
        targetId: comment.id,
        metadata: JSON.stringify({ bodySnippet: data.body.substring(0, 30), timestampMs: data.timestampMs }),
      },
    });

    return comment;
  }

  /**
   * Resolves or reopens a comment thread.
   */
  public async setThreadStatus(userId: string, threadId: string, status: "OPEN" | "RESOLVED") {
    const updated = await db.commentThread.update({
      where: { id: threadId },
      data: {
        status,
        resolvedBy: status === "RESOLVED" ? userId : null,
        resolvedAt: status === "RESOLVED" ? new Date() : null,
      },
    });

    return updated;
  }
}

export const commentService = new CommentService();
