# Database Backup & Restore Runbook

## Backup Strategy
- **Daily Automated Backups**: Retained for 30 days.
- **Weekly Backups**: Retained for 12 weeks.
- **Monthly Backups**: Retained for 12 months.
- **Encryption**: Backups are encrypted at rest using AES-256.

## Mandatory Restore Verification Procedure
1. Provision a temporary isolated database instance.
2. Restore target encrypted backup snapshot.
3. Run integrity verification checks against:
   - `User` accounts & password hashes
   - `Project` & `Scene` records
   - `Generation` history
   - `CreditWallet` & `CreditTransaction` ledger
   - `Workspace` memberships & roles
4. Confirm ledger reconciliation and asset URL references.
5. Destroy temporary database instance.
