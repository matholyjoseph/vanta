# Incident Response & Outage Runbook

## Severity Levels
- **SEV-1 (Critical)**: Complete platform outage, database corruption, or security breach. Response time < 15 mins.
- **SEV-2 (High)**: AI Provider outage, payment webhook failures, or queue backlog spike. Response time < 30 mins.
- **SEV-3 (Medium)**: Degraded performance in a single non-critical service.
- **SEV-4 (Low)**: Minor UI bug or non-blocking issue.

## Emergency Kill Switches
- **MCP Server Kill Switch**: Enable in `/admin/mcp` to halt external agent invocations immediately.
- **Public REST API Rate Limiter**: Adjust rate limits or toggle feature flags in `/admin/api`.
- **Maintenance Mode Banner**: Trigger operational maintenance banner from `/admin/settings`.
