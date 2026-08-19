import { NextResponse } from "next/server";

// In-memory sliding window rate limiter
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export class ApiRateLimiter {
  public checkRateLimit(keyId: string, limit = 100, windowMs = 60000) {
    const now = Date.now();
    const windowData = requestCounts.get(keyId);

    if (!windowData || now > windowData.resetAt) {
      requestCounts.set(keyId, { count: 1, resetAt: now + windowMs });
      return {
        allowed: true,
        limit,
        remaining: limit - 1,
        resetSeconds: Math.ceil(windowMs / 1000),
      };
    }

    if (windowData.count >= limit) {
      const resetSeconds = Math.ceil((windowData.resetAt - now) / 1000);
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetSeconds,
      };
    }

    windowData.count += 1;
    return {
      allowed: true,
      limit,
      remaining: limit - windowData.count,
      resetSeconds: Math.ceil((windowData.resetAt - now) / 1000),
    };
  }

  public createRateLimitErrorResponse(limit: number, resetSeconds: number, requestId: string) {
    return NextResponse.json(
      {
        error: {
          type: "rate_limit_error",
          code: "rate_limit_exceeded",
          message: `API rate limit of ${limit} requests per minute exceeded. Retry after ${resetSeconds} seconds.`,
          retry_after: resetSeconds,
          request_id: requestId,
        },
      },
      {
        status: 429,
        headers: {
          "RateLimit-Limit": limit.toString(),
          "RateLimit-Remaining": "0",
          "RateLimit-Reset": resetSeconds.toString(),
          "X-Request-ID": requestId,
        },
      }
    );
  }
}

export const apiRateLimiter = new ApiRateLimiter();
