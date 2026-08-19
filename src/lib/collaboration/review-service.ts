import { db } from "@/lib/db";

export class ReviewService {
  /**
   * Submits a formal review request for a specific project version.
   */
  public async requestReview(requestedBy: string, data: {
    workspaceId: string;
    projectId: string;
    versionId?: string;
    reviewerUserIds: string[];
    message?: string;
  }) {
    const review = await db.projectReview.create({
      data: {
        workspaceId: data.workspaceId,
        projectId: data.projectId,
        versionId: data.versionId || null,
        requestedBy,
        status: "IN_REVIEW",
        message: data.message || null,
        assignees: {
          create: data.reviewerUserIds.map((userId) => ({
            userId,
            status: "PENDING",
          })),
        },
      },
      include: { assignees: true },
    });

    await db.workspaceActivity.create({
      data: {
        workspaceId: data.workspaceId,
        actorUserId: requestedBy,
        action: "review.requested",
        targetType: "ProjectReview",
        targetId: review.id,
      },
    });

    return review;
  }

  /**
   * Submits an approval or request for changes.
   */
  public async submitDecision(userId: string, data: {
    reviewId: string;
    decision: "APPROVED" | "CHANGES_REQUESTED";
    comment?: string;
  }) {
    const assignee = await db.projectReviewAssignee.findFirst({
      where: { reviewId: data.reviewId, userId },
    });

    if (!assignee) {
      throw new Error("UNAUTHORIZED: User is not an assigned reviewer.");
    }

    await db.projectReviewAssignee.update({
      where: { id: assignee.id },
      data: {
        status: data.decision,
        respondedAt: new Date(),
        comment: data.comment || null,
      },
    });

    // Check overall review status
    const review = await db.projectReview.findUnique({
      where: { id: data.reviewId },
      include: { assignees: true },
    });

    if (review) {
      const hasChangesRequested = review.assignees.some((a) => a.status === "CHANGES_REQUESTED");
      const allApproved = review.assignees.every((a) => a.status === "APPROVED");

      const newStatus = hasChangesRequested ? "CHANGES_REQUESTED" : allApproved ? "APPROVED" : "IN_REVIEW";
      await db.projectReview.update({
        where: { id: review.id },
        data: { status: newStatus, completedAt: newStatus !== "IN_REVIEW" ? new Date() : null },
      });

      await db.workspaceActivity.create({
        data: {
          workspaceId: review.workspaceId,
          actorUserId: userId,
          action: data.decision === "APPROVED" ? "review.approved" : "review.changes_requested",
          targetType: "ProjectReview",
          targetId: review.id,
        },
      });
    }

    return review;
  }
}

export const reviewService = new ReviewService();
