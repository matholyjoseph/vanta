import { db } from "@/lib/db";

export class DirectorEventService {
  public async emitEvent(params: {
    directorRunId: string;
    stage: string;
    type: "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "CHECKPOINT";
    message: string;
    data?: any;
  }) {
    const event = await db.directorEvent.create({
      data: {
        directorRunId: params.directorRunId,
        stage: params.stage,
        type: params.type,
        message: params.message,
        data: params.data ? JSON.stringify(params.data) : null,
      },
    });

    return event;
  }

  public async getRunEvents(directorRunId: string, limit = 50) {
    const events = await db.directorEvent.findMany({
      where: { directorRunId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return events.map((e) => ({
      ...e,
      data: e.data ? JSON.parse(e.data) : null,
    }));
  }
}

export const directorEventService = new DirectorEventService();
