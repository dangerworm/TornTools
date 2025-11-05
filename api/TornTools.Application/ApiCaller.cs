using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.DataTransferObjects;

namespace TornTools.Application;
public class ApiCaller(IHttpClientFactory httpClientFactory, ILogger<ApiCaller> logger) : IApiCaller
{
    private readonly IHttpClientFactory _httpClientFactory = httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));
    private readonly ILogger<ApiCaller> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<bool> CallAsync(QueueItemDto item, CancellationToken ct)
    {
        var client = _httpClientFactory.CreateClient("queue-worker");

        using var req = new HttpRequestMessage(new HttpMethod(item.HttpMethod ?? "GET"), item.EndpointUrl);

        // Headers (optional)
        if (item.HeadersJson is not null)
        {
            foreach (var kvp in item.HeadersJson)
            {
                // TryAddWithoutValidation avoids format exceptions on custom headers
                req.Headers.TryAddWithoutValidation(kvp.Key, kvp.Value);
            }
        }

        // Body for non-GET/HEAD
        var method = (item.HttpMethod ?? "GET").ToUpperInvariant();
        if (method is "POST" or "PUT" or "PATCH")
        {
            if (item.PayloadJson is not null)
            {
                var payloadJson = JsonSerializer.Serialize(item.PayloadJson);
                req.Content = new StringContent(payloadJson, Encoding.UTF8, "application/json");
            }
            else
            {
                req.Content = new StringContent("{}", Encoding.UTF8, "application/json");
            }
        }

        try
        {
            var res = await client.SendAsync(req, ct);
            if (!res.IsSuccessStatusCode)
            {
                _logger.LogWarning("API call for QueueItem {Id} returned {Status} ({Reason}).",
                    item.Id, (int)res.StatusCode, res.ReasonPhrase);
                return false;
            }

            _logger.LogInformation("API call for QueueItem {Id} succeeded.", item.Id);
            return true;
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            // shutting down
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "API call for QueueItem {Id} failed.", item.Id);
            return false;
        }
    }
}