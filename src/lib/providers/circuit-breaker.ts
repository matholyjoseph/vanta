import { logger } from "@/lib/observability/logger";

export type ProviderStatus = "ONLINE" | "DEGRADED" | "OFFLINE";

export interface ProviderHealthState {
  providerId: string;
  status: ProviderStatus;
  consecutiveFailures: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
}

class ProviderCircuitBreaker {
  private states = new Map<string, ProviderHealthState>();
  private failureThreshold = 5;

  public getProviderStatus(providerId: string): ProviderStatus {
    const state = this.states.get(providerId);
    return state ? state.status : "ONLINE";
  }

  public recordSuccess(providerId: string) {
    const state = this.getOrCreateState(providerId);
    state.consecutiveFailures = 0;
    state.status = "ONLINE";
    state.lastSuccessTime = Date.now();
  }

  public recordFailure(providerId: string, error?: string) {
    const state = this.getOrCreateState(providerId);
    state.consecutiveFailures += 1;
    state.lastFailureTime = Date.now();

    if (state.consecutiveFailures >= this.failureThreshold) {
      state.status = "OFFLINE";
      logger.warn("circuit_breaker", `Provider '${providerId}' tripped to OFFLINE after ${state.consecutiveFailures} consecutive errors.`, {
        data: { error },
      });
    } else if (state.consecutiveFailures >= 2) {
      state.status = "DEGRADED";
    }
  }

  private getOrCreateState(providerId: string): ProviderHealthState {
    if (!this.states.has(providerId)) {
      this.states.set(providerId, { providerId, status: "ONLINE", consecutiveFailures: 0 });
    }
    return this.states.get(providerId)!;
  }
}

export const providerCircuitBreaker = new ProviderCircuitBreaker();
