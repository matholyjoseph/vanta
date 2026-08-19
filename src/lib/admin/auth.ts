import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export type AdminRole = "USER" | "SUPPORT" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN";

export interface AdminSessionUser {
  id: string;
  name: string | null;
  email: string | null;
  role: AdminRole;
  accountStatus: string;
}

export async function getAuthenticatedAdmin(
  allowedRoles: AdminRole[] = ["ADMIN", "SUPER_ADMIN"]
): Promise<AdminSessionUser> {
  const session = await auth();

  if (!session?.user?.id && !session?.user?.email) {
    throw new Error("Unauthorized: Authentication required.");
  }

  let dbUser = null;
  if (session.user.id) {
    dbUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, role: true, accountStatus: true },
    });
  }

  if (!dbUser && session.user.email) {
    dbUser = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, email: true, role: true, accountStatus: true },
    });
  }

  if (!dbUser) {
    throw new Error("Unauthorized: User account not found.");
  }

  if (dbUser.accountStatus === "suspended") {
    throw new Error("Forbidden: Account is suspended.");
  }

  const role = (dbUser.role as AdminRole) || "USER";

  // Bootstrap Super Admin check via environment variable
  const bootstrapEmail = process.env.ADMIN_BOOTSTRAP_EMAIL;
  const isBootstrapAdmin = bootstrapEmail && dbUser.email && dbUser.email.toLowerCase() === bootstrapEmail.toLowerCase();

  const effectiveRole: AdminRole = isBootstrapAdmin ? "SUPER_ADMIN" : role;

  const isAllowed = allowedRoles.includes(effectiveRole) || effectiveRole === "SUPER_ADMIN";

  if (!isAllowed) {
    throw new Error(`Forbidden: Insufficient privileges. Required role: ${allowedRoles.join(" or ")}`);
  }

  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: effectiveRole,
    accountStatus: dbUser.accountStatus,
  };
}

export async function logAdminAudit(params: {
  adminUserId: string;
  action: string;
  targetType: string;
  targetId?: string;
  beforeData?: unknown;
  afterData?: unknown;
  reason?: string;
  ipAddress?: string;
}) {
  try {
    await db.auditLog.create({
      data: {
        adminUserId: params.adminUserId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId || null,
        beforeData: params.beforeData ? JSON.stringify(params.beforeData) : null,
        afterData: params.afterData ? JSON.stringify(params.afterData) : null,
        reason: params.reason || null,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (err) {
    console.error("[AuditLog Error] Failed to log admin action:", err);
  }
}
