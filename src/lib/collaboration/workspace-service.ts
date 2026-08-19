import crypto from "crypto";
import { db } from "@/lib/db";

export class WorkspaceService {
  /**
   * Creates a new workspace and sets up default roles & credit wallet.
   */
  public async createWorkspace(ownerId: string, data: { name: string; description?: string }) {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + crypto.randomBytes(3).toString("hex");

    const workspace = await db.workspace.create({
      data: {
        name: data.name,
        slug,
        ownerId,
        description: data.description || null,
        status: "ACTIVE",
        wallet: {
          create: {
            balance: 1000,
          },
        },
      },
    });

    // Create default roles
    const ownerRole = await db.workspaceRole.create({
      data: { workspaceId: workspace.id, name: "Owner", key: "owner", description: "Full workspace ownership" },
    });
    await db.workspaceRole.create({
      data: { workspaceId: workspace.id, name: "Admin", key: "admin", description: "Workspace administrator" },
    });
    await db.workspaceRole.create({
      data: { workspaceId: workspace.id, name: "Editor", key: "editor", description: "Project editor" },
    });
    await db.workspaceRole.create({
      data: { workspaceId: workspace.id, name: "Reviewer", key: "reviewer", description: "Project reviewer & approver" },
    });

    // Add owner as active member
    await db.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: ownerId,
        roleId: ownerRole.id,
        status: "ACTIVE",
      },
    });

    // Log Activity
    await db.workspaceActivity.create({
      data: {
        workspaceId: workspace.id,
        actorUserId: ownerId,
        action: "workspace.created",
        targetType: "Workspace",
        targetId: workspace.id,
      },
    });

    return workspace;
  }

  /**
   * Invites a new team member via cryptographically secure invitation token.
   */
  public async inviteMember(workspaceId: string, invitedByUserId: string, data: { email: string; roleId: string }) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await db.workspaceInvitation.create({
      data: {
        workspaceId,
        email: data.email.toLowerCase(),
        roleId: data.roleId,
        tokenHash,
        invitedBy: invitedByUserId,
        expiresAt,
        status: "PENDING",
      },
    });

    await db.workspaceActivity.create({
      data: {
        workspaceId,
        actorUserId: invitedByUserId,
        action: "member.invited",
        targetType: "WorkspaceInvitation",
        targetId: invitation.id,
        metadata: JSON.stringify({ email: data.email }),
      },
    });

    return { invitation, rawToken };
  }

  /**
   * Accepts a workspace invitation using raw invitation token.
   */
  public async acceptInvitation(userId: string, rawToken: string) {
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const invitation = await db.workspaceInvitation.findUnique({ where: { tokenHash } });

    if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
      throw new Error("INVALID_INVITATION: Invitation token is invalid or expired.");
    }

    const member = await db.workspaceMember.create({
      data: {
        workspaceId: invitation.workspaceId,
        userId,
        roleId: invitation.roleId,
        status: "ACTIVE",
        invitedBy: invitation.invitedBy,
      },
    });

    await db.workspaceInvitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    });

    await db.workspaceActivity.create({
      data: {
        workspaceId: invitation.workspaceId,
        actorUserId: userId,
        action: "member.joined",
        targetType: "WorkspaceMember",
        targetId: member.id,
      },
    });

    return member;
  }
}

export const workspaceService = new WorkspaceService();
