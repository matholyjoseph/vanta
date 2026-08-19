"use client";

import * as React from "react";
import {
  CreditCard,
  Zap,
  ExternalLink,
  ShieldCheck,
  Plus,
  Loader2,
  Receipt,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  createCustomerPortalSessionAction,
  createCreditPackCheckoutSessionAction,
} from "@/app/actions/billing";
import { STRIPE_CREDIT_PACKS } from "@/lib/stripe";

interface TransactionItem {
  id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: Date;
}

interface BillingSubscription {
  status?: string;
  currentPeriodEnd?: Date | string;
  plan?: {
    key?: string;
    name?: string;
  };
}

interface BillingDashboardProps {
  subscription: BillingSubscription | null;
  wallet: { balance: number } | null;
  transactions: TransactionItem[];
}

export function BillingDashboard({
  subscription,
  wallet,
  transactions,
}: BillingDashboardProps) {
  const { showToast } = useToast();
  const [isPortalLoading, setIsPortalLoading] = React.useState(false);
  const [loadingPackId, setLoadingPackId] = React.useState<string | null>(null);

  const planName = subscription?.plan?.name || "Free Plan";
  const status = subscription?.status || "active";
  const nextBillingDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
    : "N/A";

  const handleManageSubscription = async () => {
    setIsPortalLoading(true);
    try {
      const res = await createCustomerPortalSessionAction();
      if (res.url) {
        window.location.assign(res.url);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to open billing portal";
      showToast(msg, "error");
    } finally {
      setIsPortalLoading(false);
    }
  };

  const handleBuyPack = async (packId: string) => {
    setLoadingPackId(packId);
    try {
      const res = await createCreditPackCheckoutSessionAction(packId);
      if (res.url) {
        window.location.assign(res.url);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to initiate credit purchase";
      showToast(msg, "error");
    } finally {
      setLoadingPackId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Active Subscription Plan */}
        <div className="rounded-2xl border border-border bg-surface p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-muted">
                ACTIVE PLAN
              </span>
              <Badge
                variant="outline"
                className="font-mono text-[10px] bg-accent/10 text-accent border-accent/30"
              >
                {status.toUpperCase()}
              </Badge>
            </div>
            <h3 className="text-2xl font-extrabold text-foreground">{planName}</h3>
            <p className="text-xs text-muted font-mono">
              Next Billing Date: <span className="text-foreground font-semibold">{nextBillingDate}</span>
            </p>
          </div>

          <Button
            onClick={handleManageSubscription}
            disabled={isPortalLoading}
            variant="outline"
            className="w-full text-xs font-semibold border-border hover:bg-surface-hover justify-between"
          >
            {isPortalLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Opening Portal...
              </>
            ) : (
              <>
                <span>Manage Subscription & Cards</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>

        {/* Card 2: Current Credit Balance */}
        <div className="rounded-2xl border border-accent/40 bg-accent/5 p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-accent font-bold flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 fill-current" /> CREDIT WALLET
              </span>
              <Badge variant="outline" className="font-mono text-[10px] text-accent border-accent/30">
                ACTIVE
              </Badge>
            </div>
            <div className="text-4xl font-extrabold text-foreground tracking-tight">
              {(wallet?.balance ?? 2450).toLocaleString()}
              <span className="text-xs font-mono font-normal text-muted ml-2">CREDITS</span>
            </div>
            <p className="text-xs text-muted">
              Generations deduct credits based on model and resolution settings.
            </p>
          </div>

          <div className="text-[11px] font-mono text-accent">
            ⚡ Automatic refill on monthly subscription renewal
          </div>
        </div>

        {/* Card 3: Security & Commercial Rights */}
        <div className="rounded-2xl border border-border bg-surface p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-muted flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-accent" /> LICENSING & SECURITY
            </span>
            <h4 className="font-bold text-sm text-foreground">Commercial Usage License</h4>
            <p className="text-xs text-muted leading-relaxed">
              Full commercial rights enabled for all video renders and generated assets. Raw payment details are encrypted via Stripe.
            </p>
          </div>

          <div className="text-[11px] font-mono text-muted flex items-center gap-1">
            <CreditCard className="h-3.5 w-3.5 text-accent" /> Powered by Stripe Payments
          </div>
        </div>
      </div>

      {/* Extra Credit Packs Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" /> Purchase Extra Credit Packs
            </h3>
            <p className="text-xs text-muted mt-0.5">
              One-time credit top-ups that never expire. Added instantly to your wallet.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {STRIPE_CREDIT_PACKS.map((pack) => (
            <div
              key={pack.id}
              className="rounded-2xl border border-border bg-surface p-5 space-y-4 hover:border-accent/50 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-2">
                <Badge variant="outline" className="font-mono text-[10px] text-accent border-accent/30">
                  ONE-TIME PACK
                </Badge>
                <div className="text-2xl font-extrabold text-foreground">
                  {pack.credits.toLocaleString()}{" "}
                  <span className="text-xs font-mono text-muted font-normal">Credits</span>
                </div>
                <div className="text-lg font-bold text-accent">${pack.priceUSD} USD</div>
              </div>

              <Button
                onClick={() => handleBuyPack(pack.id)}
                disabled={loadingPackId === pack.id}
                className="w-full bg-accent text-accent-foreground hover:bg-accent-hover font-bold text-xs shadow-md"
              >
                {loadingPackId === pack.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Buy {pack.credits.toLocaleString()} Credits
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Billing & Transaction Ledger */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Receipt className="h-5 w-5 text-accent" /> Credit Transaction History
        </h3>

        {transactions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted font-mono">
            No credit transactions recorded yet.
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-surface overflow-hidden divide-y divide-border">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-4 flex items-center justify-between gap-4 text-xs font-mono hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      tx.amount > 0 ? "bg-accent/20 text-accent" : "bg-surface-hover text-muted"
                    }`}
                  >
                    {tx.amount > 0 ? "+" : ""}
                  </div>
                  <div>
                    <div className="font-bold text-foreground font-sans">{tx.description}</div>
                    <div className="text-[10px] text-muted">{tx.type}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`font-bold text-sm ${
                      tx.amount > 0 ? "text-accent" : "text-foreground"
                    }`}
                  >
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount} CREDITS
                  </div>
                  <div className="text-[10px] text-muted">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
