"use client";

import * as React from "react";
import { Ticket, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createPromoCodeAction } from "@/app/actions/admin-actions";

interface CouponItem {
  id: string;
  code: string;
  creditAmount: number;
  maxRedemptions: number;
  redemptions: number;
  enabled: boolean;
  newUsersOnly: boolean;
  createdAt: Date | string;
}

interface AdminCouponsClientProps {
  coupons: CouponItem[];
}

export function AdminCouponsClient({ coupons: initialCoupons }: AdminCouponsClientProps) {
  const { showToast } = useToast();
  const [coupons, setCoupons] = React.useState<CouponItem[]>(initialCoupons);
  const [modalOpen, setModalOpen] = React.useState(false);

  const [code, setCode] = React.useState("");
  const [creditAmount, setCreditAmount] = React.useState(250);
  const [maxRedemptions, setMaxRedemptions] = React.useState(100);
  const [newUsersOnly, setNewUsersOnly] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setSubmitting(true);
    try {
      const res = await createPromoCodeAction({
        code: code.trim(),
        creditAmount: Number(creditAmount),
        maxRedemptions: Number(maxRedemptions),
        newUsersOnly,
      });

      showToast(`Promo code '${res.promo.code}' created successfully!`, "success");
      setCoupons((prev) => [res.promo as any, ...prev]);
      setModalOpen(false);
      setCode("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create promo code";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Ticket className="h-6 w-6 text-accent" /> Promotional Vouchers & Coupons
          </h1>
          <p className="text-xs text-muted mt-1 font-mono">
            Create promotional credit vouchers for marketing campaigns and growth grants.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          className="bg-accent text-accent-foreground font-bold text-xs h-9 cursor-pointer"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Create Promo Code
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-background border-b border-border text-muted uppercase text-[10px]">
              <tr>
                <th className="p-4">Promo Code</th>
                <th className="p-4">Credit Grant</th>
                <th className="p-4">Redemptions</th>
                <th className="p-4">New Users Only</th>
                <th className="p-4">Status</th>
                <th className="p-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted">
                    No promo codes created yet.
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-surface-hover transition-colors">
                    <td className="p-4 font-bold text-accent tracking-wider font-mono">
                      {coupon.code}
                    </td>
                    <td className="p-4 font-bold text-foreground">
                      +{coupon.creditAmount} CREDITS
                    </td>
                    <td className="p-4 text-muted">
                      {coupon.redemptions} / {coupon.maxRedemptions}
                    </td>
                    <td className="p-4 text-muted">{coupon.newUsersOnly ? "Yes" : "No"}</td>
                    <td className="p-4">
                      {coupon.enabled ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-surface text-muted border-border text-[10px]">
                          Disabled
                        </Badge>
                      )}
                    </td>
                    <td className="p-4 text-muted">{new Date(coupon.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-md bg-surface border-border text-foreground font-sans">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                Create New Promotional Voucher
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreateCoupon} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-muted uppercase">Promo Code String</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. LAUNCH2026"
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-xs font-mono text-accent font-bold uppercase tracking-wider focus:outline-none focus:border-accent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-muted uppercase">Credit Amount</label>
                  <input
                    type="number"
                    min={10}
                    max={10000}
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl p-2 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-muted uppercase">Max Redemptions</label>
                  <input
                    type="number"
                    min={1}
                    max={100000}
                    value={maxRedemptions}
                    onChange={(e) => setMaxRedemptions(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl p-2 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
                    required
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-border bg-background cursor-pointer">
                <input
                  type="checkbox"
                  checked={newUsersOnly}
                  onChange={(e) => setNewUsersOnly(e.target.checked)}
                  className="accent-[#c8ff00]"
                />
                <span className="text-xs font-mono font-bold">New Users Only</span>
              </label>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="bg-accent text-accent-foreground font-bold text-xs">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Voucher"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
