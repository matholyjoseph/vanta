"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createCheckoutSessionAction } from "@/app/actions/billing";
import { useToast } from "@/components/ui/toast";

export interface PlanItem {
  id?: string;
  key: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  monthlyCredits: number;
  maxConcurrentGenerations: number;
  maxResolution: string;
  storageLimit: string;
  generationPriority: string;
  commercialUsage: boolean;
  isPopular?: boolean;
  features: string[] | Record<string, unknown>;
}

interface PricingPresentationProps {
  plans: PlanItem[];
  currentPlanKey?: string;
  isAuthenticated: boolean;
}

export function PricingPresentation({
  plans,
  currentPlanKey = "FREE",
  isAuthenticated,
}: PricingPresentationProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isAnnual, setIsAnnual] = React.useState(true);
  const [loadingPlanKey, setLoadingPlanKey] = React.useState<string | null>(null);

  const handleSelectPlan = async (planKey: string) => {
    if (!isAuthenticated) {
      router.push(`/auth?mode=signup&plan=${planKey}`);
      return;
    }

    setLoadingPlanKey(planKey);
    try {
      const res = await createCheckoutSessionAction(planKey, isAnnual);
      if (res.url) {
        window.location.assign(res.url);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to initiate checkout";
      showToast(msg, "error");
    } finally {
      setLoadingPlanKey(null);
    }
  };

  return (
    <div className="space-y-12 py-6">
      {/* Billing Cycle Switcher */}
      <div className="flex items-center justify-center gap-4">
        <span className={`text-xs font-mono font-semibold ${!isAnnual ? "text-foreground" : "text-muted"}`}>
          MONTHLY BILLING
        </span>
        <button
          onClick={() => setIsAnnual(!isAnnual)}
          className="relative inline-flex h-6 w-11 items-center rounded-full bg-surface border border-border p-0.5 transition-colors cursor-pointer"
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-accent transition-transform ${
              isAnnual ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        <span className={`text-xs font-mono font-semibold flex items-center gap-1.5 ${isAnnual ? "text-foreground" : "text-muted"}`}>
          ANNUAL BILLING
          <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30 text-[10px]">
            SAVE 20%
          </Badge>
        </span>
      </div>

      {/* 4 Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {plans.map((plan) => {
          const isPro = plan.key === "PRO";
          const isCurrent = currentPlanKey === plan.key;
          const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
          const featuresList: string[] = Array.isArray(plan.features) ? plan.features : [];

          return (
            <div
              key={plan.id}
              className={`group relative overflow-hidden rounded-2xl border p-6 transition-all flex flex-col justify-between ${
                isPro
                  ? "border-accent bg-accent/5 shadow-[0_0_30px_rgba(200,255,0,0.15)] ring-1 ring-accent/50"
                  : "border-border bg-surface hover:border-accent/40"
              }`}
            >
              {/* Highlight Ribbon for PRO */}
              {isPro && (
                <div className="absolute top-0 right-0">
                  <div className="bg-accent text-accent-foreground font-mono text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-md">
                    MOST POPULAR
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {/* Header */}
                <div className="space-y-2">
                  <Badge variant="outline" className="font-mono text-[10px] text-muted border-border">
                    {plan.key}
                  </Badge>
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  <p className="text-xs text-muted leading-relaxed min-h-[36px]">
                    {plan.description}
                  </p>
                </div>

                {/* Price Display */}
                <div className="border-y border-border/60 py-4 space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-foreground tracking-tight">
                      ${price}
                    </span>
                    <span className="text-xs font-mono text-muted">/ month</span>
                  </div>
                  {isAnnual && price > 0 && (
                    <div className="text-[10px] font-mono text-accent">
                      Billed annually (${price * 12}/year)
                    </div>
                  )}
                </div>

                {/* Specs Highlight Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                  <div className="p-2.5 rounded-lg border border-border bg-background/50">
                    <div className="text-[9px] text-muted uppercase">CREDITS</div>
                    <div className="font-bold text-accent">{plan.monthlyCredits.toLocaleString()}/mo</div>
                  </div>
                  <div className="p-2.5 rounded-lg border border-border bg-background/50">
                    <div className="text-[9px] text-muted uppercase">MAX RES</div>
                    <div className="font-bold text-foreground">{plan.maxResolution}</div>
                  </div>
                </div>

                {/* Feature List */}
                <div className="space-y-2.5 text-xs text-foreground/90 font-sans">
                  {featuresList.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6">
                <Button
                  onClick={() => handleSelectPlan(plan.key)}
                  disabled={loadingPlanKey === plan.key || isCurrent}
                  className={`w-full font-bold h-11 text-xs shadow-md ${
                    isCurrent
                      ? "bg-surface-hover text-muted cursor-not-allowed border border-border"
                      : isPro
                      ? "bg-accent text-accent-foreground hover:bg-accent-hover"
                      : "bg-surface text-foreground hover:bg-surface-hover border border-border"
                  }`}
                >
                  {loadingPlanKey === plan.key ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirecting to Stripe...
                    </>
                  ) : isCurrent ? (
                    "Current Active Plan"
                  ) : isAuthenticated ? (
                    <>
                      Upgrade to {plan.name} <ArrowRight className="ml-1.5 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Choose Plan <ArrowRight className="ml-1.5 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
