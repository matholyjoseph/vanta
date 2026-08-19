"use client";

import * as React from "react";
import {
  Users,
  Search,
  Plus,
  Minus,
  ShieldCheck,
  Ban,
  CheckCircle2,
  MoreVertical,
  Loader2,
  Sparkles,
  Receipt,
  Film,
  FolderGit2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  getAdminUserDetailAction,
  adjustUserCreditsAdminAction,
  changeUserRoleAction,
  toggleUserSuspensionAction,
} from "@/app/actions/admin-actions";

interface UserItem {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  accountStatus: string;
  createdAt: Date | string;
  creditWallet?: { balance: number } | null;
  subscription?: { plan?: { name: string } } | null;
  _count?: { generations: number; assets: number; projects: number };
}

interface AdminUsersClientProps {
  initialUsers: UserItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  adminRole: string;
}

export function AdminUsersClient({
  initialUsers,
  totalCount,
  totalPages,
  currentPage,
  adminRole,
}: AdminUsersClientProps) {
  const { showToast } = useToast();

  const [users, setUsers] = React.useState<UserItem[]>(initialUsers);
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("ALL");
  const [statusFilter, setStatusFilter] = React.useState("ALL");

  // Selected User Modal States
  const [selectedUser, setSelectedUser] = React.useState<UserItem | null>(null);
  const [userDetail, setUserDetail] = React.useState<any>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);

  // Credit Adjustment Modal State
  const [creditModalOpen, setCreditModalOpen] = React.useState(false);
  const [creditAmount, setCreditAmount] = React.useState(500);
  const [creditOp, setCreditOp] = React.useState<"ADD" | "REMOVE">("ADD");
  const [creditReason, setCreditReason] = React.useState("");
  const [creditSubmitting, setCreditSubmitting] = React.useState(false);

  // Role Change Modal State
  const [roleModalOpen, setRoleModalOpen] = React.useState(false);
  const [targetRole, setTargetRole] = React.useState<string>("USER");
  const [roleSubmitting, setRoleSubmitting] = React.useState(false);

  // Suspension Modal State
  const [suspendModalOpen, setSuspendModalOpen] = React.useState(false);
  const [suspendReason, setSuspendReason] = React.useState("");
  const [suspendSubmitting, setSuspendSubmitting] = React.useState(false);

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      !search ||
      (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
      u.id.includes(search);

    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchStatus = statusFilter === "ALL" || u.accountStatus === statusFilter;

    return matchSearch && matchRole && matchStatus;
  });

  // Handle Open User Detail
  const handleOpenDetail = async (user: UserItem) => {
    setSelectedUser(user);
    setDetailLoading(true);
    try {
      const res = await getAdminUserDetailAction(user.id);
      setUserDetail(res.user);
    } catch {
      showToast("Failed to fetch detailed user record", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  // Handle Adjust Credits
  const handleAdjustCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !creditReason.trim()) return;

    setCreditSubmitting(true);
    try {
      const res = await adjustUserCreditsAdminAction({
        targetUserId: selectedUser.id,
        amount: Number(creditAmount),
        operation: creditOp,
        reason: creditReason.trim(),
      });

      showToast(
        `Successfully ${creditOp === "ADD" ? "added" : "removed"} ${creditAmount} credits! New balance: ${res.newBalance}`,
        "success"
      );

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id
            ? { ...u, creditWallet: { balance: res.newBalance } }
            : u
        )
      );

      setCreditModalOpen(false);
      setCreditReason("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to adjust credits";
      showToast(msg, "error");
    } finally {
      setCreditSubmitting(false);
    }
  };

  // Handle Change Role
  const handleChangeRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setRoleSubmitting(true);
    try {
      await changeUserRoleAction(selectedUser.id, targetRole as any);
      showToast(`User role updated to ${targetRole}`, "success");

      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, role: targetRole } : u))
      );

      setRoleModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to change role";
      showToast(msg, "error");
    } finally {
      setRoleSubmitting(false);
    }
  };

  // Handle Toggle Suspension
  const handleToggleSuspension = async () => {
    if (!selectedUser) return;
    const isSuspended = selectedUser.accountStatus === "suspended";

    setSuspendSubmitting(true);
    try {
      const res = await toggleUserSuspensionAction(selectedUser.id, !isSuspended, suspendReason);
      showToast(`User account ${!isSuspended ? "suspended" : "unsuspended"}`, "info");

      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id ? { ...u, accountStatus: res.status } : u
        )
      );

      setSuspendModalOpen(false);
      setSuspendReason("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to change suspension status";
      showToast(msg, "error");
    } finally {
      setSuspendSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-accent" /> Platform User Management
          </h1>
          <p className="text-xs text-muted mt-1 font-mono">
            {totalCount} total registered users across free & paid tiers.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface p-4 rounded-2xl border border-border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or User ID..."
            className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-background border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
          >
            <option value="ALL">All Roles</option>
            <option value="USER">USER</option>
            <option value="SUPPORT">SUPPORT</option>
            <option value="MODERATOR">MODERATOR</option>
            <option value="ADMIN">ADMIN</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-background border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
          >
            <option value="ALL">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-background border-b border-border text-muted uppercase text-[10px]">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Credits</th>
                <th className="p-4">Generations</th>
                <th className="p-4">Joined</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted">
                    No users matching search filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => handleOpenDetail(user)}
                    className="hover:bg-surface-hover transition-colors cursor-pointer"
                  >
                    <td className="p-4 font-bold text-foreground font-sans">
                      {user.name || "Unnamed Creator"}
                    </td>
                    <td className="p-4 text-muted">{user.email}</td>
                    <td className="p-4">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          user.role === "SUPER_ADMIN"
                            ? "bg-accent/15 text-accent border-accent/40"
                            : user.role === "ADMIN"
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                            : "bg-surface text-muted border-border"
                        }`}
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {user.accountStatus === "suspended" ? (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-[10px]">
                          Suspended
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                          Active
                        </Badge>
                      )}
                    </td>
                    <td className="p-4 font-bold text-accent">
                      {(user.creditWallet?.balance ?? 100).toLocaleString()} CR
                    </td>
                    <td className="p-4 text-muted">{user._count?.generations || 0}</td>
                    <td className="p-4 text-muted">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDetail(user)}
                        className="h-8 text-[11px] font-mono border-border"
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Inspection Drawer / Modal */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-surface border-border text-foreground font-sans">
            <DialogHeader className="border-b border-border pb-4">
              <DialogTitle className="text-xl font-bold flex items-center justify-between">
                <span>User Record — {selectedUser.name || selectedUser.email}</span>
                <Badge variant="outline" className="text-xs font-mono text-accent border-accent/30">
                  ID: {selectedUser.id}
                </Badge>
              </DialogTitle>
            </DialogHeader>

            {detailLoading ? (
              <div className="py-12 text-center text-muted">
                <Loader2 className="h-8 w-8 text-accent animate-spin mx-auto mb-2" />
                <p className="text-xs font-mono">Loading complete user audit history...</p>
              </div>
            ) : userDetail ? (
              <div className="space-y-6 pt-2">
                {/* Admin Quick Action Buttons Bar */}
                <div className="flex flex-wrap gap-2 p-3 bg-background rounded-xl border border-border">
                  <Button
                    size="sm"
                    onClick={() => setCreditModalOpen(true)}
                    className="bg-accent text-accent-foreground font-bold text-xs h-9 cursor-pointer"
                  >
                    <Sparkles className="mr-1.5 h-4 w-4" /> Adjust Credits
                  </Button>

                  {adminRole === "SUPER_ADMIN" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRoleModalOpen(true)}
                      className="text-xs font-mono border-border h-9"
                    >
                      <ShieldCheck className="mr-1.5 h-4 w-4 text-purple-400" /> Change Role ({userDetail.role})
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant={userDetail.accountStatus === "suspended" ? "default" : "destructive"}
                    onClick={() => setSuspendModalOpen(true)}
                    className="text-xs font-bold h-9 cursor-pointer"
                  >
                    {userDetail.accountStatus === "suspended" ? (
                      <>
                        <CheckCircle2 className="mr-1.5 h-4 w-4" /> Unsuspend Account
                      </>
                    ) : (
                      <>
                        <Ban className="mr-1.5 h-4 w-4" /> Suspend Account
                      </>
                    )}
                  </Button>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 bg-background rounded-xl border border-border">
                    <div className="text-[10px] text-muted uppercase">ROLE</div>
                    <div className="font-bold text-accent">{userDetail.role}</div>
                  </div>
                  <div className="p-3 bg-background rounded-xl border border-border">
                    <div className="text-[10px] text-muted uppercase">CREDIT BALANCE</div>
                    <div className="font-bold text-accent">
                      {(userDetail.creditWallet?.balance ?? 0).toLocaleString()} CR
                    </div>
                  </div>
                  <div className="p-3 bg-background rounded-xl border border-border">
                    <div className="text-[10px] text-muted uppercase">PLAN</div>
                    <div className="font-bold text-foreground">
                      {userDetail.subscription?.plan?.name || "Free Explorer"}
                    </div>
                  </div>
                  <div className="p-3 bg-background rounded-xl border border-border">
                    <div className="text-[10px] text-muted uppercase">ACCOUNT STATUS</div>
                    <div className="font-bold text-foreground uppercase">{userDetail.accountStatus}</div>
                  </div>
                </div>

                {/* Credit Ledger History */}
                <div className="space-y-2">
                  <div className="text-xs font-mono font-bold text-muted uppercase flex items-center gap-1.5">
                    <Receipt className="h-4 w-4 text-accent" /> Recent Credit Transactions
                  </div>
                  <div className="rounded-xl border border-border bg-background divide-y divide-border overflow-hidden max-h-44 overflow-y-auto">
                    {userDetail.creditWallet?.transactions?.length === 0 ? (
                      <div className="p-4 text-center text-xs font-mono text-muted">No transactions.</div>
                    ) : (
                      userDetail.creditWallet?.transactions?.map((tx: any) => (
                        <div key={tx.id} className="p-3 flex items-center justify-between text-xs font-mono">
                          <div>
                            <div className="font-bold text-foreground">{tx.description}</div>
                            <div className="text-[10px] text-muted">{tx.type} • {new Date(tx.createdAt).toLocaleDateString()}</div>
                          </div>
                          <div className={`font-bold ${tx.amount > 0 ? "text-accent" : "text-destructive"}`}>
                            {tx.amount > 0 ? `+${tx.amount}` : tx.amount} CR
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Recent Generations */}
                <div className="space-y-2">
                  <div className="text-xs font-mono font-bold text-muted uppercase flex items-center gap-1.5">
                    <Film className="h-4 w-4 text-accent" /> Recent Generations ({userDetail.generations?.length || 0})
                  </div>
                  <div className="space-y-2 max-h-44 overflow-y-auto">
                    {userDetail.generations?.map((gen: any) => (
                      <div key={gen.id} className="p-3 rounded-xl border border-border bg-background flex items-center justify-between text-xs font-mono">
                        <div className="truncate max-w-md">
                          <span className="font-bold text-accent mr-2">{gen.model?.name || gen.modelId}</span>
                          <span className="text-foreground italic">&ldquo;{gen.prompt}&rdquo;</span>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {gen.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      )}

      {/* Credit Adjustment Modal */}
      {creditModalOpen && selectedUser && (
        <Dialog open={creditModalOpen} onOpenChange={setCreditModalOpen}>
          <DialogContent className="max-w-md bg-surface border-border text-foreground font-sans">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                Manual Credit Adjustment — {selectedUser.email}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdjustCredits} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-muted uppercase">Operation</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCreditOp("ADD")}
                    className={`py-2 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                      creditOp === "ADD"
                        ? "bg-accent text-accent-foreground border-accent"
                        : "bg-background border-border text-muted"
                    }`}
                  >
                    + ADD CREDITS
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreditOp("REMOVE")}
                    className={`py-2 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                      creditOp === "REMOVE"
                        ? "bg-destructive text-destructive-foreground border-destructive"
                        : "bg-background border-border text-muted"
                    }`}
                  >
                    - REMOVE CREDITS
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-muted uppercase">Amount (Credits)</label>
                <input
                  type="number"
                  min={1}
                  max={100000}
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-sm font-mono text-foreground focus:outline-none focus:border-accent"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-muted uppercase">Internal Audit Reason</label>
                <textarea
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  placeholder="State business reason (e.g. Promotional grant, Refund compensation...)"
                  rows={2}
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent resize-none font-sans"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setCreditModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creditSubmitting} className="bg-accent text-accent-foreground font-bold text-xs">
                  {creditSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Adjustment"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Role Change Modal */}
      {roleModalOpen && selectedUser && (
        <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
          <DialogContent className="max-w-md bg-surface border-border text-foreground font-sans">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                Change User Role — {selectedUser.email}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleChangeRole} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-muted uppercase">Target Access Role</label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
                >
                  <option value="USER">USER (Standard Creator)</option>
                  <option value="SUPPORT">SUPPORT (Read User Data)</option>
                  <option value="MODERATOR">MODERATOR (Content Queue)</option>
                  <option value="ADMIN">ADMIN (Operational Manager)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Full Platform Authority)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setRoleModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={roleSubmitting} className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs">
                  {roleSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Role"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Suspension Modal */}
      {suspendModalOpen && selectedUser && (
        <Dialog open={suspendModalOpen} onOpenChange={setSuspendModalOpen}>
          <DialogContent className="max-w-md bg-surface border-border text-foreground font-sans">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                {selectedUser.accountStatus === "suspended" ? "Unsuspend User Account" : "Suspend User Account"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <p className="text-xs text-muted">
                {selectedUser.accountStatus === "suspended"
                  ? "Unsuspending this user will restore their ability to generate videos."
                  : "Suspending this user will immediately block generation requests and restrict access."}
              </p>

              {selectedUser.accountStatus !== "suspended" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-muted uppercase">Suspension Reason</label>
                  <textarea
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="Enter reason for account suspension..."
                    rows={2}
                    className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent resize-none font-sans"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setSuspendModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleToggleSuspension}
                  disabled={suspendSubmitting}
                  variant={selectedUser.accountStatus === "suspended" ? "default" : "destructive"}
                  className="font-bold text-xs"
                >
                  {suspendSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Action"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
