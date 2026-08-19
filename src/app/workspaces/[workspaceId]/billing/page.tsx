import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CreditCard, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToastProvider } from "@/components/ui/toast";

interface RouteParams {
  params: Promise<{ workspaceId: string }>;
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const resolved = await params;
  const workspace = await db.workspace.findUnique({ where: { id: resolved.workspaceId } });
  return { title: `Billing & Credits — ${workspace?.name || "Workspace"}` };
}

export default async function WorkspaceBillingPage({ params }: RouteParams) {
  const resolved = await params;
  const workspace = await db.workspace.findUnique({
    where: { id: resolved.workspaceId },
    include: { wallet: { include: { transactions: { take: 10, orderBy: { createdAt: "desc" } } } } },
  });

  if (!workspace) return notFound();

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background text-foreground p-6 md:p-10 space-y-8 max-w-7xl mx-auto font-sans">
        <div className="border-b border-border pb-6 flex items-center justify-between">
          <div>
            <Link href={`/workspaces/${workspace.id}`} className="text-muted hover:text-foreground font-mono text-xs mb-1 block">
              ← {workspace.name} Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
              <CreditCard className="h-7 w-7 text-accent" /> Workspace Billing & Credits
            </h1>
          </div>

          <Link href="/pricing">
            <Button className="bg-accent text-accent-foreground font-bold text-xs h-10 px-5">
              <Zap className="h-4 w-4 mr-2" /> Buy Workspace Credits
            </Button>
          </Link>
        </div>

        <div className="p-6 rounded-3xl border border-border bg-surface/50 space-y-3 font-mono text-xs shadow-2xl">
          <span className="text-muted text-[10px] uppercase">Available Workspace Credit Balance</span>
          <div className="text-4xl font-extrabold text-accent">{workspace.wallet?.balance ?? 1000} Credits</div>
        </div>

        <div className="rounded-2xl border border-border bg-surface/50 p-6 space-y-4 font-mono text-xs">
          <span className="font-bold text-foreground block">Recent Credit Transactions</span>
          <div className="space-y-2">
            {workspace.wallet?.transactions.map((t) => (
              <div key={t.id} className="p-3 rounded-xl border border-border bg-background flex items-center justify-between">
                <div>
                  <span className="font-bold text-foreground block">{t.description}</span>
                  <span className="text-[10px] text-muted">{new Date(t.createdAt).toLocaleString()}</span>
                </div>
                <span className={t.amount < 0 ? "font-bold text-destructive" : "font-bold text-accent"}>
                  {t.amount > 0 ? `+${t.amount}` : t.amount} Credits
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
