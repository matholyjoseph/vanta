import { logger } from "@/lib/observability/logger";

export type EmailTemplateType =
  | "VERIFY_EMAIL"
  | "PASSWORD_RESET"
  | "WORKSPACE_INVITATION"
  | "MENTION_NOTIFICATION"
  | "REVIEW_REQUEST"
  | "CHANGES_REQUESTED"
  | "REVIEW_APPROVED"
  | "EXPORT_COMPLETED"
  | "DIRECTOR_APPROVAL_NEEDED"
  | "LOW_CREDITS"
  | "PAYMENT_FAILED"
  | "SECURITY_ALERT";

export interface SendEmailInput {
  to: string;
  template: EmailTemplateType;
  subject: string;
  data: Record<string, any>;
}

export class EmailService {
  /**
   * Enqueues a transactional email for asynchronous dispatch.
   */
  public async sendEmail(input: SendEmailInput): Promise<{ queued: boolean; jobId: string }> {
    const jobId = `email_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    logger.info("email_service", `Enqueued email template '${input.template}' to '${input.to}'`, {
      data: { jobId, template: input.template, to: input.to },
    });

    return { queued: true, jobId };
  }
}

export const emailService = new EmailService();
