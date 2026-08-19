import { db } from "@/lib/db";

export const DEFAULT_LAUNCH_CHECKS = [
  { key: "db_backups_enabled", category: "BACKUPS", required: true, notes: "Automated daily backups enabled and encrypted at rest." },
  { key: "backup_restore_tested", category: "RESTORE", required: true, notes: "Database restore procedure tested against staging dataset." },
  { key: "monitoring_enabled", category: "MONITORING", required: true, notes: "Sentry/OpenTelemetry error tracking and alerts configured." },
  { key: "stripe_webhook_verified", category: "PAYMENTS", required: true, notes: "Stripe production webhook signature verification & idempotency enabled." },
  { key: "provider_circuit_breaker", category: "PROVIDERS", required: true, notes: "AI Provider health monitoring & graceful fallback tested." },
  { key: "email_deliverability", category: "EMAIL", required: true, notes: "Async email queue, SPF, DKIM, DMARC records documented." },
  { key: "legal_pages_drafted", category: "LEGAL", required: true, notes: "Terms, Privacy, Cookies, Acceptable Use, and Security policy pages populated." },
  { key: "support_desk_ready", category: "SUPPORT", required: true, notes: "Support ticket workflow & admin desk verified." },
  { key: "load_test_passed", category: "PERFORMANCE", required: true, notes: "Staging load test passed for 500+ concurrent requests." },
  { key: "security_audit_passed", category: "SECURITY", required: true, notes: "SSRF protections, security headers, upload validation, and secret redaction verified." },
];

export class LaunchService {
  public async initializeChecklist() {
    for (const check of DEFAULT_LAUNCH_CHECKS) {
      await db.launchCheck.upsert({
        where: { key: check.key },
        create: {
          key: check.key,
          category: check.category,
          required: check.required,
          notes: check.notes,
          status: "NOT_STARTED",
        },
        update: {},
      });
    }
  }

  public async getChecklist() {
    await this.initializeChecklist();
    return db.launchCheck.findMany({
      orderBy: { category: "asc" },
    });
  }

  public async updateCheckStatus(key: string, status: string, notes?: string, verifiedBy?: string) {
    return db.launchCheck.update({
      where: { key },
      data: {
        status,
        notes: notes || undefined,
        verifiedBy: verifiedBy || undefined,
        verifiedAt: status === "PASS" ? new Date() : undefined,
      },
    });
  }
}

export const launchService = new LaunchService();
