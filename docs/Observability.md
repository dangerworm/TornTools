# Observability

The API now ships with structured logging, correlation IDs, and lightweight metrics to help trace and debug requests end-to-end.

## Logging

- **Format:** Console logs are emitted in JSON with UTC timestamps and scoped properties.
- **Correlation IDs:**
  - Incoming requests can provide `X-Correlation-ID`; otherwise the server issues one and echoes it back on the response.
  - The correlation ID is pushed into the logging scope so every downstream log (controllers, repositories, background jobs) carries the same identifier.
- **What gets logged:**
  - Request lifecycle events (method, path, status code, duration, correlation ID)
  - Database operations (operation name, duration, success/failure)
  - Third-party calls (target host, call type, duration, success/failure)

### Consuming the logs

1. Run the API (`dotnet run` from `api/TornTools.Api` or the solution root if available in your environment).
2. Send requests with an optional `X-Correlation-ID` header to stitch together downstream logs.
3. Inspect console output for JSON lines; each entry includes `CorrelationId`, `ElapsedMs`, and other structured fields that can be ingested by log forwarders.

## Metrics

Metrics are exposed at `GET /metrics` as a JSON payload. The shape includes request, database, and external-call aggregates with counts, error totals, and timing statistics.

Example response:

```json
{
  "requests": {
    "aggregate": {"total": 42, "errors": 1, "averageMs": 35.4, "maxMs": 110.2},
    "byRoute": {
      "/api/items/1/history/price": {"total": 5, "errors": 0, "averageMs": 20.1, "maxMs": 25.8}
    }
  },
  "database": {
    "GetAllItemsAsync": {"total": 3, "errors": 0, "averageMs": 12.6, "maxMs": 15.0}
  },
  "external": {
    "api.torn.com": {"total": 2, "errors": 1, "averageMs": 250.3, "maxMs": 400.7}
  }
}
```

Use these metrics to track latency trends and error rates or feed them into a dashboard/exporter of your choice.
