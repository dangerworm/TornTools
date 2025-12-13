using Microsoft.AspNetCore.Http;

namespace TornTools.Api.Observability;

public static class HttpContextExtensions
{
    public static string GetCorrelationId(this HttpContext context)
    {
        if (context.Items.TryGetValue(CorrelationConstants.ItemKey, out var value)
            && value is string correlationId
            && !string.IsNullOrWhiteSpace(correlationId))
        {
            return correlationId;
        }

        return context.TraceIdentifier;
    }
}
