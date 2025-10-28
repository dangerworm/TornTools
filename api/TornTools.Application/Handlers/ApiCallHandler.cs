using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using TornTools.Application.DataTransferObjects;
using TornTools.Application.Interfaces;

namespace TornTools.Application.Handlers;
public class ApiCallHandler : IApiCallHandler
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<ApiCallHandler> _logger;

    public ApiCallHandler(IHttpClientFactory httpClientFactory, ILogger<ApiCallHandler> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<bool> ProcessAsync(QueueItemDto item, CancellationToken ct)
    {
        var client = _httpClientFactory.CreateClient("queue-worker");

        using var req = new HttpRequestMessage(new HttpMethod(item.HttpMethod ?? "GET"), item.EndpointUrl);

        // Headers (optional)
        if (!string.IsNullOrWhiteSpace(item.HeadersJson))
        {
            try
            {
                var headers = JsonSerializer.Deserialize<Dictionary<string, string>>(item.HeadersJson);
                if (headers != null)
                {
                    foreach (var kvp in headers)
                    {
                        // TryAddWithoutValidation avoids format exceptions on custom headers
                        req.Headers.TryAddWithoutValidation(kvp.Key, kvp.Value);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Invalid HeadersJson on QueueItem {Id}. Ignoring headers.", item.Id);
            }
        }

        // Body for non-GET/HEAD
        var method = (item.HttpMethod ?? "GET").ToUpperInvariant();
        if (method is "POST" or "PUT" or "PATCH")
        {
            if (!string.IsNullOrWhiteSpace(item.PayloadJson))
            {
                req.Content = new StringContent(item.PayloadJson, Encoding.UTF8, "application/json");
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