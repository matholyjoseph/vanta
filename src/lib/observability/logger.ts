export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";

export interface LogEvent {
  timestamp: string;
  level: LogLevel;
  service: string;
  environment: string;
  requestId?: string;
  userId?: string;
  workspaceId?: string;
  operation: string;
  message: string;
  durationMs?: number;
  errorCode?: string;
  data?: any;
}

class Logger {
  private serviceName = "vanta-core";

  private redactSecrets(obj: any): any {
    if (!obj || typeof obj !== "object") return obj;
    const redacted = Array.isArray(obj) ? [...obj] : { ...obj };

    const sensitiveKeys = [
      "password", "secret", "token", "authorization", "cookie",
      "apiKey", "api_key", "stripe_secret", "bearer", "privateKey"
    ];

    for (const key of Object.keys(redacted)) {
      if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
        redacted[key] = "[REDACTED]";
      } else if (typeof redacted[key] === "object") {
        redacted[key] = this.redactSecrets(redacted[key]);
      }
    }
    return redacted;
  }

  public log(level: LogLevel, operation: string, message: string, meta?: Partial<LogEvent>) {
    const event: LogEvent = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      environment: process.env.NODE_ENV || "development",
      operation,
      message,
      ...meta,
      data: meta?.data ? this.redactSecrets(meta.data) : undefined,
    };

    if (process.env.NODE_ENV === "production") {
      console.log(JSON.stringify(event));
    } else {
      console.log(`[${event.timestamp}] [${level}] [${operation}]: ${message}`);
    }
  }

  public debug(operation: string, message: string, meta?: Partial<LogEvent>) {
    this.log("DEBUG", operation, message, meta);
  }

  public info(operation: string, message: string, meta?: Partial<LogEvent>) {
    this.log("INFO", operation, message, meta);
  }

  public warn(operation: string, message: string, meta?: Partial<LogEvent>) {
    this.log("WARN", operation, message, meta);
  }

  public error(operation: string, message: string, meta?: Partial<LogEvent>) {
    this.log("ERROR", operation, message, meta);
  }

  public fatal(operation: string, message: string, meta?: Partial<LogEvent>) {
    this.log("FATAL", operation, message, meta);
  }
}

export const logger = new Logger();
