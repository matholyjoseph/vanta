"use client";

import * as React from "react";
import { User, Shield, Monitor, KeyRound, Trash2, Loader2, Save, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { updateProfileAction, changePasswordAction, deleteAccountAction } from "@/app/actions/auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AccountClientProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  preference: {
    aspectRatio?: string;
    creatorType?: string;
  } | null;
}

export function AccountClient({ user, preference }: AccountClientProps) {
  const { showToast } = useToast();

  // Profile Form
  const [name, setName] = React.useState(user.name || "");
  const [aspectRatio, setAspectRatio] = React.useState(preference?.aspectRatio || "16:9");
  const [isProfileSaving, setIsProfileSaving] = React.useState(false);

  // Security Form
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmNewPassword, setConfirmNewPassword] = React.useState("");
  const [isPasswordSaving, setIsPasswordSaving] = React.useState(false);

  // Delete Account Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfileSaving(true);
    try {
      await updateProfileAction({ name, aspectRatio });
      showToast("Profile settings saved successfully!", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile";
      showToast(msg, "error");
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      showToast("New passwords do not match", "error");
      return;
    }
    setIsPasswordSaving(true);
    try {
      await changePasswordAction({ currentPassword, newPassword });
      showToast("Password updated successfully!", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to change password";
      showToast(msg, "error");
    } finally {
      setIsPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccountAction();
      showToast("Account deleted.", "success");
      window.location.href = "/";
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete account";
      showToast(msg, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* 1. Profile Settings */}
      <div className="rounded-2xl border border-border bg-surface p-6 space-y-6">
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <User className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-bold text-foreground">Profile & Creator Info</h2>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-muted uppercase">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3.5 bg-background border border-border rounded-xl text-xs font-mono text-foreground focus:outline-none focus:border-accent"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-muted uppercase">Email Address</label>
              <input
                type="email"
                disabled
                value={user.email || ""}
                className="w-full h-10 px-3.5 bg-background/50 border border-border rounded-xl text-xs font-mono text-muted cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-mono text-muted uppercase">Default Aspect Ratio</label>
            <div className="grid grid-cols-3 gap-3">
              {["16:9", "9:16", "1:1"].map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setAspectRatio(ratio)}
                  className={`p-3 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                    aspectRatio === ratio
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border bg-background text-muted hover:border-accent/40"
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              disabled={isProfileSaving}
              className="bg-accent text-accent-foreground hover:bg-accent-hover font-bold text-xs h-10 px-5"
            >
              {isProfileSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="mr-1.5 h-3.5 w-3.5" /> Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* 2. Security & Password */}
      <div className="rounded-2xl border border-border bg-surface p-6 space-y-6">
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <KeyRound className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-bold text-foreground">Security & Password</h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted uppercase">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full h-10 px-3.5 bg-background border border-border rounded-xl text-xs font-mono text-foreground focus:outline-none focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-muted uppercase">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-10 px-3.5 bg-background border border-border rounded-xl text-xs font-mono text-foreground focus:outline-none focus:border-accent"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-muted uppercase">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full h-10 px-3.5 bg-background border border-border rounded-xl text-xs font-mono text-foreground focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              disabled={isPasswordSaving}
              variant="outline"
              className="border-border hover:bg-surface-hover text-xs font-bold h-10 px-5"
            >
              {isPasswordSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* 3. Connected Accounts */}
      <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <Shield className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-bold text-foreground">Connected Accounts</h2>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-background">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <div>
              <div className="font-bold text-xs text-foreground">Google OAuth</div>
              <div className="text-[10px] text-muted font-mono">Single sign-on authentication</div>
            </div>
          </div>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-mono">
            READY
          </Badge>
        </div>
      </div>

      {/* 4. Danger Zone */}
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-destructive/20 pb-4">
          <Trash2 className="h-5 w-5 text-destructive" />
          <h2 className="text-lg font-bold text-destructive">Danger Zone</h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="font-bold text-xs text-foreground">Delete Account & Data</div>
            <div className="text-[11px] text-muted">
              Permanently remove your profile, projects, assets, and credit wallet.
            </div>
          </div>
          <Button
            onClick={() => setIsDeleteModalOpen(true)}
            variant="destructive"
            className="font-bold text-xs h-9 shrink-0 cursor-pointer"
          >
            Delete Account
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md bg-surface border-border">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2 font-bold">
              <AlertTriangle className="h-5 w-5" /> Permanently Delete Account?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted leading-relaxed">
              This action cannot be undone. All your generated video assets, projects, and remaining credits will be permanently removed.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-xs border-border"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                variant="destructive"
                className="text-xs font-bold"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, Delete Account"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
