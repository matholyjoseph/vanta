"use server";

import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { db } from "@/lib/db";
import { getAuthenticatedOrGuestUser } from "@/lib/guest-auth";
import { permissionService } from "@/lib/collaboration/permission-service";
import { workspaceService } from "@/lib/collaboration/workspace-service";
import { commentService } from "@/lib/collaboration/comment-service";
import { reviewService } from "@/lib/collaboration/review-service";
import { createCinemaProjectAction } from "@/app/actions/cinema-actions";

export async function createWorkspaceAction(data: { name: string; description?: string }) {
  const user = await getAuthenticatedOrGuestUser();
  const workspace = await workspaceService.createWorkspace(user.id, data);
  revalidatePath("/workspaces");
  return workspace;
}

export async function getUserWorkspacesAction() {
  const user = await getAuthenticatedOrGuestUser();
  const members = await db.workspaceMember.findMany({
    where: { userId: user.id, status: "ACTIVE" },
    include: {
      workspace: {
        include: {
          members: { include: { role: true } },
          wallet: true,
        },
      },
      role: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return members.map((m) => ({
    ...m.workspace,
    currentUserRole: m.role,
  }));
}

export async function inviteWorkspaceMemberAction(workspaceId: string, data: { email: string; roleId: string }) {
  const user = await getAuthenticatedOrGuestUser();
  await permissionService.requirePermission(user.id, workspaceId, "members:invite");
  const res = await workspaceService.inviteMember(workspaceId, user.id, data);
  revalidatePath(`/workspaces/${workspaceId}/members`);
  return res;
}

export async function acceptWorkspaceInvitationAction(rawToken: string) {
  const user = await getAuthenticatedOrGuestUser();
  const member = await workspaceService.acceptInvitation(user.id, rawToken);
  revalidatePath("/workspaces");
  return member;
}

export async function updateMemberRoleAction(workspaceId: string, targetUserId: string, newRoleId: string) {
  const user = await getAuthenticatedOrGuestUser();
  await permissionService.requirePermission(user.id, workspaceId, "members:manage_roles");

  const member = await db.workspaceMember.update({
    where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    data: { roleId: newRoleId },
  });

  revalidatePath(`/workspaces/${workspaceId}/members`);
  return member;
}

export async function removeWorkspaceMemberAction(workspaceId: string, targetUserId: string) {
  const user = await getAuthenticatedOrGuestUser();
  await permissionService.requirePermission(user.id, workspaceId, "members:remove");

  const workspace = await db.workspace.findUnique({ where: { id: workspaceId } });
  if (workspace?.ownerId === targetUserId) {
    throw new Error("CANNOT_REMOVE_OWNER: Primary workspace owner cannot be removed.");
  }

  await db.workspaceMember.update({
    where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    data: { status: "REMOVED" },
  });

  revalidatePath(`/workspaces/${workspaceId}/members`);
  return { success: true };
}

export async function moveProjectToWorkspaceAction(projectId: string, workspaceId: string) {
  const user = await getAuthenticatedOrGuestUser();
  await permissionService.requirePermission(user.id, workspaceId, "projects:create");

  const project = await db.project.findFirst({ where: { id: projectId, userId: user.id } });
  if (!project) throw new Error("Project not found.");

  // Move project to workspace
  const updatedProject = await db.project.update({
    where: { id: projectId },
    data: { workspaceId, visibility: "WORKSPACE" },
  });

  // Safe dependency resolver: Share referenced project assets into workspace
  await db.asset.updateMany({
    where: { projectId: projectId },
    data: { workspaceId, visibility: "WORKSPACE" },
  });

  revalidatePath(`/workspaces/${workspaceId}/projects`);
  return updatedProject;
}

export async function createCommentAction(data: {
  workspaceId: string;
  projectId?: string;
  targetType: string;
  targetId: string;
  timestampMs?: number;
  body: string;
  parentCommentId?: string;
}) {
  const user = await getAuthenticatedOrGuestUser();
  await permissionService.requirePermission(user.id, data.workspaceId, "comments:create");

  const comment = await commentService.addComment(user.id, data);
  revalidatePath(`/workspaces/${data.workspaceId}`);
  return comment;
}

export async function resolveCommentAction(workspaceId: string, threadId: string, status: "OPEN" | "RESOLVED") {
  const user = await getAuthenticatedOrGuestUser();
  await permissionService.requirePermission(user.id, workspaceId, "comments:create");

  const updated = await commentService.setThreadStatus(user.id, threadId, status);
  revalidatePath(`/workspaces/${workspaceId}`);
  return updated;
}

export async function requestReviewAction(data: {
  workspaceId: string;
  projectId: string;
  versionId?: string;
  reviewerUserIds: string[];
  message?: string;
}) {
  const user = await getAuthenticatedOrGuestUser();
  await permissionService.requirePermission(user.id, data.workspaceId, "reviews:create");

  const review = await reviewService.requestReview(user.id, data);
  revalidatePath(`/workspaces/${data.workspaceId}`);
  return review;
}

export async function submitReviewDecisionAction(data: {
  workspaceId: string;
  reviewId: string;
  decision: "APPROVED" | "CHANGES_REQUESTED";
  comment?: string;
}) {
  const user = await getAuthenticatedOrGuestUser();
  await permissionService.requirePermission(user.id, data.workspaceId, "reviews:approve");

  const review = await reviewService.submitDecision(user.id, data);
  revalidatePath(`/workspaces/${data.workspaceId}`);
  return review;
}

export async function createExternalReviewLinkAction(workspaceId: string, projectId: string) {
  const user = await getAuthenticatedOrGuestUser();
  await permissionService.requirePermission(user.id, workspaceId, "projects:share");

  const rawToken = crypto.randomBytes(24).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const link = await db.externalReviewLink.create({
    data: {
      workspaceId,
      projectId,
      tokenHash,
      status: "ACTIVE",
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    },
  });

  return { link, rawToken };
}
