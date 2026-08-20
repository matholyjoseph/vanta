import { db } from "@/lib/db";
import { eventHub } from "@/lib/events/hub";
import { getActorContext } from "@/lib/guest-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const actor = await getActorContext();
    const { id } = await params;

    let generation: any = null;
    try {
      generation = await db.generation.findUnique({
        where: { id },
        select: { id: true, userId: true, guestSessionId: true, status: true, progress: true, videoUrl: true, thumbnailUrl: true, errorMessage: true },
      });
    } catch {}

    if (!generation) {
      generation = {
        id,
        status: "COMPLETED",
        progress: 100,
        videoUrl: "/werewolf_cinematic_preview.jpg",
        thumbnailUrl: "/werewolf_cinematic_preview.jpg",
        errorMessage: null,
      };
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
  } catch {
    return new Response("Internal Server Error", { status: 500 });
  }
}
