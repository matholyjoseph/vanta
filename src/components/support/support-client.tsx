"use client";

import * as React from "react";
import Link from "next/link";
import { MessageSquare, Send, Sparkles, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createSupportTicketAction } from "@/app/actions/support-actions";
import { useToast } from "@/components/ui/toast";

export function SupportClient({ initialTickets = [] }: { initialTickets: any[] }) {
  const { showToast } = useToast();
  const [tickets, setTickets] = React.useState(initialTickets);
  const [category, setCategory] = React.useState("GENERATION");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      const ticket = await createSupportTicketAction({ category, subject, message });
      setTickets([ticket, ...tickets]);
      setSubject("");
      setMessage("");
      showToast("Support ticket submitted!", "success");
    } catch (err: any) {
      showToast(err?.message || "Failed to submit ticket", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-10 space-y-8 max-w-5xl mx-auto font-sans">
      <div className="border-b border-border pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <LifeBuoy className="h-7 w-7 text-accent" /> Support Center & Help Desk
          </h1>
        </div>

        <Link href="/help">
          <Button variant="outline" className="border-border font-mono text-xs">
            Browse Help Documentation
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="p-6 rounded-3xl border border-border bg-surface/50 space-y-4 font-mono text-xs shadow-2xl">
        <span className="font-bold text-foreground text-sm block">Submit Support Request</span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] text-muted uppercase">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-border bg-background p-3 font-bold text-accent"
            >
              <option value="GENERATION">Generation Issue</option>
              <option value="BILLING">Billing & Credits</option>
              <option value="ACCOUNT">Account Access</option>
              <option value="API">API Platform</option>
              <option value="MCP">MCP Integration</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-muted uppercase">Subject</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Short issue summary..."
              className="w-full rounded-xl border border-border bg-background p-3 text-foreground"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-muted uppercase">Message Details</label>
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Provide relevant IDs (Generation ID, Project ID) or steps..."
            rows={4}
            className="w-full rounded-xl border border-border bg-background p-3 text-foreground"
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || !subject.trim() || !message.trim()}
          className="bg-accent text-accent-foreground font-bold text-xs h-10 px-6 rounded-xl cursor-pointer"
        >
          {isSubmitting ? "Submitting Ticket..." : "Submit Support Ticket"}
        </Button>
      </form>

      {/* Tickets List */}
      <div className="rounded-2xl border border-border bg-surface/50 overflow-hidden font-mono text-xs">
        <div className="p-4 border-b border-border font-bold text-foreground bg-surface/40">Your Support Tickets</div>
        <div className="divide-y divide-border/60">
          {tickets.map((t) => (
            <div key={t.id} className="p-4 flex items-center justify-between">
              <div>
                <span className="font-bold text-foreground block">{t.subject}</span>
                <span className="text-[10px] text-muted block mt-0.5">{t.category} · {new Date(t.createdAt).toLocaleDateString()}</span>
              </div>
              <Badge variant="outline" className="border-accent text-accent">
                {t.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
