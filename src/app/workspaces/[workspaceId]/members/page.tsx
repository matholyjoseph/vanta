import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getAuthenticatedOrGuestUser } from "@/lib/guest-auth";
import { permissionService } from "@/lib/collaboration/permission-service";
import { MembersClient } from "@/components/workspaces/members-client";
import { ToastProvider } from "@/components/ui/toast";

interface RouteParams {
  params: Promise<{ workspaceId: string }>;
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const resolved = await params;
  const workspace = await db.workspace.findUnique({ where: { id: resolved.workspaceId } });
  return {
    title: `Members — ${workspace?.name || "Workspace"}`,
  };
}

export default async function WorkspaceMembersPage({ params }: RouteParams) {
  const resolved = await params;
  const user = await getAuthenticatedOrGuestUser();

  const workspace = await db.workspace.findUnique({
    where: { id: resolved.workspaceId },
    include: {
      members: {
        include: { role: true },
        orderBy: { joinedAt: "asc" },
      },
      roles: true,
      invitations: { where: { status: "PENDING" }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!workspace) return notFound();

  const canManageRoles = await permissionService.hasPermission(user.id, workspace.id, "members:manage_roles");
  const canInvite = await permissionService.hasPermission(user.id, workspace.id, "members:invite");

  return (
    <ToastProvider>
      <MembersClient
        workspace={workspace}
        members={workspace.members}
        roles={workspace.roles}
        invitations={workspace.invitations}
        canManageRoles={canManageRoles}
        canInvite={canInvite}
      />
    </ToastProvider>
  );
}
