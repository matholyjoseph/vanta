"use client";

import * as React from "react";
import { MessageSquare, Clock, Send, CheckCircle2, AtSign, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createCommentAction, resolveCommentAction } from "@/app/actions/workspace-actions";
import { useToast } from "@/components/ui/toast";

export function TimestampCommentsDrawer({
  workspaceId,
  projectId,
  targetType = "PROJECT",
  targetId,
  currentTimeMs = 0,
  initialComments = [],
}: {
  workspaceId: string;
  projectId?: string;
  targetType?: string;
  targetId: string;
  currentTimeMs?: number;
  initialComments?: any[];
}) {
  const { showToast } = useToast();
  const [commentText, setCommentText] = React.useState("");
  const [comments, setComments] = React.useState(initialComments);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const formatTimestamp = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    const milli = Math.floor((ms % 1000) / 10);
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}.${milli.toString().padStart(2, "0")}`;
  };

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    setIsSubmitting(true);

    try {
      const newComment = await createCommentAction({
        workspaceId,
        projectId,
        targetType,
        targetId,
        timestampMs: currentTimeMs,
        body: commentText,
      });

      setComments([newComment, ...comments]);
      setCommentText("");
      showToast("Comment posted at " + formatTimestamp(currentTimeMs), "success");
    } catch (err: any) {
      showToast(err?.message || "Failed to post comment", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-border bg-surface/50 p-5 space-y-4 font-mono text-xs shadow-2xl">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <span className="font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-accent" /> Timeline Comments & Review Notes
        </span>
        <Badge variant="outline" className="border-accent text-accent">
          <Clock className="h-3 w-3 mr-1" /> {formatTimestamp(currentTimeMs)}
        </Badge>
      </div>

      {/* Input Box */}
      <div className="space-y-2">
        <div className="relative">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment at current timestamp... Use @Teammate to mention"
            rows={3}
            className="w-full rounded-2xl border border-border bg-background p-3 text-xs text-foreground focus:ring-1 focus:ring-accent"
          />
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handlePostComment}
            disabled={isSubmitting || !commentText.trim()}
            className="bg-accent text-accent-foreground font-bold text-xs h-9 px-4 rounded-xl cursor-pointer"
          >
            <Send className="h-3.5 w-3.5 mr-1.5" /> Post Comment
          </Button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-3 pt-2 max-h-80 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="text-center py-6 text-muted text-[11px]">
            No comments yet on this project timeline.
          </div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="p-3 rounded-2xl border border-border bg-background space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-accent" />
                  <span className="font-bold text-foreground">Teammate</span>
                  {c.timestampMs !== null && (
                    <Badge variant="outline" className="text-[10px] border-border text-muted">
                      {formatTimestamp(c.timestampMs)}
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] text-muted">{new Date(c.createdAt).toLocaleTimeString()}</span>
              </div>
              <p className="text-foreground text-xs font-sans">{c.body}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
