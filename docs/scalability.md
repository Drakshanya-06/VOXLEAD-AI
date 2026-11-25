# Scalability Strategy — 100,000 Registered Users

This is a proposed production design, not a claim that the prototype has been load-tested for 100,000 users. Registered users and concurrent voice sessions are different capacity dimensions. A workload model must estimate active-user ratio, simultaneous sessions, average call length, requests per second, token throughput and audio bandwidth.

## Proposed architecture

- Serve the React build through a CDN.
- Run multiple stateless Express API instances behind a managed load balancer.
- Store session/auth state in signed tokens or a shared session store; do not rely on process memory.
- Use MongoDB replica sets, tenant-aware indexes and backups. Consider sharding only after measured data volume/write throughput justifies it.
- Add Redis for hot reads, rate-limit counters and short-lived session coordination.
- Put long-running summaries, CRM sync and analytics into a durable queue with retry/dead-letter handling.
- Use streaming speech infrastructure and a telephony provider for real phone calls; browser speech APIs are not a phone platform.
- Apply per-tenant quotas, LLM token budgets, concurrency limits and backpressure.
- Add centralized logs, metrics, traces, alerting and cost dashboards.

## Capacity planning

1. Define target peak concurrent voice sessions separately from total registered accounts.
2. Load-test API chat turns, database writes and model-provider quotas independently.
3. Measure p50/p95 latency, error rate, tokens per conversation and cost per qualified lead.
4. Run stress, soak and failover tests; set autoscaling thresholds from measured CPU, memory, queue depth and latency.
5. Review provider rate limits and regional availability before launch.

## Cost model

Estimate monthly cost as: compute + database + cache + queue + storage + CDN + speech minutes + LLM input/output tokens + monitoring + support. Model usage is usually driven by call duration, turns, prompt/context size and generated tokens. Obtain current vendor pricing and measure real usage; do not use prototype estimates as production quotes.
