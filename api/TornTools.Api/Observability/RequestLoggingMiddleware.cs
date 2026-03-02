using System.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using TornTools.Api.Observability;
using TornTools.Application.Interfaces;

namespace TornTools.Api.Observability;

public class RequestLoggingMiddleware(
    RequestDelegate next,
    ILogger<RequestLoggingMiddleware> logger,
    IMetricsCollector metricsCollector)
{
    private readonly RequestDelegate _next = next ?? throw new ArgumentNullException(nameof(next));
    private readonly ILogger<RequestLoggingMiddleware> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly IMetricsCollector _metricsCollector = metricsCollector ?? throw new ArgumentNullException(nameof(metricsCollector));

    public async Task InvokeAsync(HttpContext context)
    {
        var start = Stopwatch.StartNew();
        var correlationId = context.GetCorrelationId();
        var statusCode = StatusCodes.Status200OK;

        try
        {
            await _next(context);
            statusCode = context.Response.StatusCode;
        }
        catch (Exception ex)
        {
            statusCode = StatusCodes.Status500InternalServerError;
            _logger.LogError(
                ex,
                "Unhandled exception processing {Method} {Path} (CorrelationId: {CorrelationId}).",
                context.Request.Method,
                context.Request.Path,
                correlationId);
            throw;
        }
        finally
        {
            start.Stop();
            _metricsCollector.RecordRequest(context.Request.Path.ToString(), statusCode, start.Elapsed);

            _logger.LogInformation(
                "Handled {Method} {Path} with {StatusCode} in {ElapsedMs} ms (CorrelationId: {CorrelationId}).",
                context.Request.Method,
                context.Request.Path,
                statusCode,
                Math.Round(start.Elapsed.TotalMilliseconds, 2),
                correlationId);
        }
    }
}
