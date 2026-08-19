# VANTA AI - Production Deployment & Hardening Guide

This document defines production deployment prerequisites, environment security, and operational guidelines for VANTA AI.

## Architectural Components
- **Web App & Dashboard**: Next.js App Router (Node.js/Turbopack)
- **Database**: PostgreSQL (with Prisma ORM and connection pooling)
- **Caching & Queues**: Redis & BullMQ
- **Object Storage**: S3/R2 object storage for video, audio, image assets
- **Email Delivery**: Queue-based transactional email service
- **Observability**: Structured JSON logging, secret redaction, Sentry error monitoring

## Environment Security
- Server secrets are validated at startup via `src/lib/env.ts`.
- All JSON logs automatically filter and redact tokens, secrets, cookies, and passwords via `src/lib/observability/logger.ts`.
- Public URLs undergo SSRF validation (`src/lib/security/ssrf-protection.ts`) blocking `localhost`, private IP ranges, and cloud metadata endpoints.
