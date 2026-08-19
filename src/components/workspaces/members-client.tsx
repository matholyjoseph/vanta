"use client";

import * as React from "react";
import Link from "next/link";
import { Users, UserPlus, Shield, Trash2, Mail, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { inviteWorkspaceMemberAction, updateMemberRoleAction, removeWorkspaceMemberAction } from "@/app/actions/workspace-actions";
import { useToast } from "@/components/ui/toast";

export function MembersClient({
  workspace,
  members = [],
  roles = [],
  invitations = [],
  canManageRoles,
  canInvite,
}: {
  workspace: any;
  members: any[];
  roles: any[];
  invitations: any[];
  canManageRoles: boolean;
  canInvite: boolean;
}) {
  const { showToast } = useToast();
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [selectedRoleId, setSelectedRoleId] = React.useState(roles[0]?.id || "");
  const [isInviting, setIsInviting] = React.useState(false);
  const [memberList, setMemberList] = React.useState(members);
  const [inviteList, setInviteList] = React.useState(invitations);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    try {
      const res = await inviteWorkspaceMemberAction(workspace.id, { email: inviteEmail, roleId: selectedRoleId });
      setInviteList([res.invitation, ...inviteList]);
      setInviteEmail("");
      showToast("Invitation sent to " + inviteEmail, "success");
    } catch (err: any) {
      showToast(err?.message || "Failed to send invitation", "error");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (targetUserId: string, newRoleId: string) => {
    try {
      await updateMemberRoleAction(workspace.id, targetUserId, newRoleId);
      setMemberList(memberList.map((m) => (m.userId === targetUserId ? { ...m, roleId: newRoleId } : m)));
      showToast("Member role updated", "info");
    } catch (err: any) {
      showToast(err?.message || "Failed to update role", "error");
    }
  };

  const handleRemove = async (targetUserId: string) => {
    try {
      await removeWorkspaceMemberAction(workspace.id, targetUserId);
      setMemberList(memberList.filter((m) => m.userId !== targetUserId));
      showToast("Member removed from workspace", "info");
    } catch (err: any) {
      showToast(err?.message || "Failed to remove member", "error");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-10 space-y-8 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="border-b border-border pb-6 flex items-center justify-between">
        <div>
          <Link href={`/workspaces/${workspace.id}`} className="text-muted hover:text-foreground font-mono text-xs mb-1 block">
            ← {workspace.name} Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <Users className="h-7 w-7 text-accent" /> Team Members & Roles
          </h1>
        </div>

        <Badge variant="outline" className="border-accent text-accent font-mono text-xs">
          {memberList.length} / {workspace.seatLimit} SEATS USED
        </Badge>
      </div>

      {/* Invite Modal / Box */}
      {canInvite && (
        <form onSubmit={handleInvite} className="p-6 rounded-3xl border border-border bg-surface/50 space-y-4 font-mono text-xs shadow-2xl">
          <span className="font-bold text-foreground flex items-center gap-2 text-sm">
            <UserPlus className="h-4 w-4 text-accent" /> Invite New Team Member
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="teammate@example.com"
              className="sm:col-span-2 rounded-xl border border-border bg-background p-3 text-xs text-foreground focus:ring-1 focus:ring-accent"
            />
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="rounded-xl border border-border bg-background p-3 text-xs text-foreground font-bold"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="submit"
            disabled={isInviting || !inviteEmail.trim()}
            className="bg-accent text-accent-foreground font-bold text-xs h-10 px-6 rounded-xl cursor-pointer"
          >
            {isInviting ? "Sending Invite..." : "Send Workspace Invitation"}
          </Button>
        </form>
      )}

      {/* Members Table */}
      <div className="rounded-2xl border border-border bg-surface/50 overflow-hidden font-mono text-xs">
        <div className="p-4 border-b border-border font-bold text-foreground bg-surface/40">Active Team Members</div>
        <div className="divide-y divide-border/60">
          {memberList.map((m) => (
            <div key={m.id} className="p-4 flex items-center justify-between">
              <div>
                <span className="font-bold text-foreground block">User ID: {m.userId.substring(0, 12)}...</span>
                <span className="text-[10px] text-muted block mt-0.5">Joined: {new Date(m.joinedAt).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-accent text-accent">
                  {m.role?.name || "Member"}
                </Badge>

                {canManageRoles && workspace.ownerId !== m.userId && (
                  <Button size="sm" variant="ghost" onClick={() => handleRemove(m.userId)} className="h-8 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
