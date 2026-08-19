import { db } from "@/lib/db";

export type WorkspacePermissionKey =
  | "workspace:view"
  | "workspace:manage"
  | "workspace:delete"
  | "workspace:billing"
  | "members:view"
  | "members:invite"
  | "members:remove"
  | "members:manage_roles"
  | "projects:view"
  | "projects:create"
  | "projects:edit"
  | "projects:delete"
  | "projects:share"
  | "assets:view"
  | "assets:create"
  | "assets:delete"
  | "generation:create"
  | "generation:cancel"
  | "credits:view"
  | "credits:spend"
  | "credits:manage"
  | "comments:create"
  | "comments:edit_own"
  | "comments:delete_own"
  | "reviews:create"
  | "reviews:approve"
  | "exports:create"
  | "brand:manage";

const DEFAULT_ROLE_PERMISSIONS: Record<string, WorkspacePermissionKey[]> = {
  owner: [
    "workspace:view", "workspace:manage", "workspace:delete", "workspace:billing",
    "members:view", "members:invite", "members:remove", "members:manage_roles",
    "projects:view", "projects:create", "projects:edit", "projects:delete", "projects:share",
    "assets:view", "assets:create", "assets:delete",
    "generation:create", "generation:cancel",
    "credits:view", "credits:spend", "credits:manage",
    "comments:create", "comments:edit_own", "comments:delete_own",
    "reviews:create", "reviews:approve", "exports:create", "brand:manage"
  ],
  admin: [
    "workspace:view", "workspace:manage", "workspace:billing",
    "members:view", "members:invite", "members:remove", "members:manage_roles",
    "projects:view", "projects:create", "projects:edit", "projects:delete", "projects:share",
    "assets:view", "assets:create", "assets:delete",
    "generation:create", "generation:cancel",
    "credits:view", "credits:spend", "credits:manage",
    "comments:create", "comments:edit_own", "comments:delete_own",
    "reviews:create", "reviews:approve", "exports:create", "brand:manage"
  ],
  editor: [
    "workspace:view", "members:view",
    "projects:view", "projects:create", "projects:edit", "projects:share",
    "assets:view", "assets:create",
    "generation:create", "credits:view", "credits:spend",
    "comments:create", "comments:edit_own",
    "reviews:create", "reviews:approve", "exports:create"
  ],
  creator: [
    "workspace:view", "members:view",
    "projects:view", "projects:create", "projects:edit",
    "assets:view", "assets:create",
    "generation:create", "credits:view", "credits:spend",
    "comments:create", "comments:edit_own", "exports:create"
  ],
  reviewer: [
    "workspace:view", "members:view",
    "projects:view", "assets:view", "credits:view",
    "comments:create", "comments:edit_own",
    "reviews:create", "reviews:approve"
  ],
  viewer: [
    "workspace:view", "members:view", "projects:view", "assets:view", "credits:view"
  ],
};

export class PermissionService {
  /**
   * Verifies if a user has a specific permission key within a workspace.
   */
  public async hasPermission(userId: string, workspaceId: string, permissionKey: WorkspacePermissionKey): Promise<boolean> {
    const workspace = await db.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace || workspace.status !== "ACTIVE") return false;

    // Owner has superpass
    if (workspace.ownerId === userId) return true;

    const member = await db.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      include: { role: { include: { permissions: true } } },
    });

    if (!member || member.status !== "ACTIVE") return false;

    // Check custom role permissions if configured
    if (member.role.permissions && member.role.permissions.length > 0) {
      return member.role.permissions.some((p) => p.permissionKey === permissionKey);
    }

    // Fallback to default role map
    const defaultPerms = DEFAULT_ROLE_PERMISSIONS[member.role.key.toLowerCase()] || [];
    return defaultPerms.includes(permissionKey);
  }

  public async requirePermission(userId: string, workspaceId: string, permissionKey: WorkspacePermissionKey): Promise<void> {
    const allowed = await this.hasPermission(userId, workspaceId, permissionKey);
    if (!allowed) {
      throw new Error(`PERMISSION_DENIED: User lacks required permission '${permissionKey}' in workspace.`);
    }
  }
}

export const permissionService = new PermissionService();
