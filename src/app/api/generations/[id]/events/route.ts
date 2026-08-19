import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eventHub } from "@/lib/events/hub";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id && !session?.user?.email) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const generation = await db.generation.findUnique({
    where: { id },
    select: { id: true, userId: true, status: true, progress: true, videoUrl: true, thumbnailUrl: true, errorMessage: true },
  });

  if (!generation) {
    return new Response("Generation not found", { status: 404 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Helper to send SSE event
      const sendEvent = (event: string, data: Record<string, unknown>) => {
        try {
          const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Stream closed
        }
      };

      // Initial state push
      sendEvent("generation.update", {
        status: generation.status,
        progress: generation.progress,
        videoUrl: generation.videoUrl,
        thumbnailUrl: generation.thumbnailUrl,
        error: generation.errorMessage,
      });

      // EventHub subscriber
      const listener = (data: { status: string; progress: number; videoUrl?: string; thumbnailUrl?: string; error?: string }) => {
        sendEvent("generation.update", data);
        if (data.status === "COMPLETED" || data.status === "FAILED" || data.status === "CANCELLED") {
          eventHub.off(`generation:${id}`, listener);
          try {
            controller.close();
          } catch {
            // Already closed
          }
        }
      };

      eventHub.on(`generation:${id}`, listener);

      // Heartbeat interval every 15s to keep SSE connection alive
      const heartbeat = setInterval(() => {
        sendEvent("ping", { time: Date.now() });
      }, 15000);

      // Cleanup on disconnect
      req.signal.addEventListener("abort", () => {
        eventHub.off(`generation:${id}`, listener);
        clearInterval(heartbeat);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
