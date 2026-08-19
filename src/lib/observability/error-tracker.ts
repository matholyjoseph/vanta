import { logger } from "./logger";

export interface SafeErrorContext {
  requestId?: string;
  userId?: string;
  workspaceId?: string;
  generationId?: string;
  modelId?: string;
  provider?: string;
  operation: string;
}

export class ErrorTrackerService {
  public captureException(error: Error | any, context: SafeErrorContext) {
    logger.error(context.operation, error?.message || "Unhandled Exception", {
      requestId: context.requestId,
      userId: context.userId,
      workspaceId: context.workspaceId,
      errorCode: error?.code || "UNHANDLED_EXCEPTION",
      data: {
        stack: process.env.NODE_ENV !== "production" ? error?.stack : undefined,
        generationId: context.generationId,
        modelId: context.modelId,
        provider: context.provider,
      },
    });
  }
}

export const errorTracker = new ErrorTrackerService();
