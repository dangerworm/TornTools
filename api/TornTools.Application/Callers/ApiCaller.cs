using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;

namespace TornTools.Application.Callers;
public abstract class ApiCaller<TCaller>(
    ILogger<TCaller> logger,
    IApiCallHandlerResolver handlerResolver
)
{
    protected readonly ILogger<TCaller> Logger = logger ?? throw new ArgumentNullException(nameof(logger));
    protected readonly IApiCallHandlerResolver HandlerResolver = handlerResolver ?? throw new ArgumentNullException(nameof(handlerResolver));

    public abstract IEnumerable<ApiCallType> CallTypes { get; }
    protected abstract string ClientName { get; }

    protected virtual async Task<bool> CallAsync(QueueItemDto queueItem, CancellationToken stoppingToken)
    {
        var httpClientHandler = new HttpClientHandler
        {
            AutomaticDecompression = 
                DecompressionMethods.GZip |
                DecompressionMethods.Deflate |
                DecompressionMethods.Brotli
        };

        using var client = new HttpClient(httpClientHandler);

        using var requestMessage = new HttpRequestMessage(
            new HttpMethod(queueItem.HttpMethod ?? "GET"),
            queueItem.EndpointUrl
        );

        // Headers (optional)
        AddHeaders(requestMessage, queueItem);

        // Body for non-GET/HEAD
        AddBody(queueItem, requestMessage);

        try
        {
            var content = await Fetch(client, requestMessage, stoppingToken);
            if (content is null)
            {
                Logger.LogWarning("API call for {QueueItem} {Id} failed.", nameof(QueueItemDto), queueItem.Id);
                return false;
            }

            var handler = HandlerResolver.GetHandler(queueItem.CallType);
            await handler.HandleResponseAsync(content, stoppingToken);

            return true;
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            // shutting down
            return false;
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "API call for {QueueItem} {Id} failed.", nameof(QueueItemDto), queueItem.Id);
            return false;
        }
    }

    protected virtual void AddHeaders(HttpRequestMessage requestMessage, QueueItemDto queueItem)
    {
        if (queueItem.HeadersJson is not null)
        {
            foreach (var kvp in queueItem.HeadersJson)
            {
                // TryAddWithoutValidation avoids format exceptions on custom headers
                requestMessage.Headers.TryAddWithoutValidation(kvp.Key, kvp.Value);
            }
        }
    }

    protected virtual void AddBody(QueueItemDto queueItem, HttpRequestMessage requestMessage)
    {
        var method = (queueItem.HttpMethod ?? "GET").ToUpperInvariant();
        if (method is "POST" or "PUT" or "PATCH")
        {
            if (queueItem.PayloadJson is not null)
            {
                var payloadJson = JsonSerializer.Serialize(queueItem.PayloadJson);
                requestMessage.Content = new StringContent(payloadJson, Encoding.UTF8, "application/json");
            }
            else
            {
                requestMessage.Content = new StringContent("{}", Encoding.UTF8, "application/json");
            }
        }
    }

    protected virtual async Task<string?> Fetch(HttpClient client, HttpRequestMessage requestMessage, CancellationToken stoppingToken)
    {
        var responseMessage = await client.SendAsync(requestMessage, HttpCompletionOption.ResponseHeadersRead, stoppingToken);
        var content = await responseMessage.Content.ReadAsStringAsync(stoppingToken);

        if (!responseMessage.IsSuccessStatusCode)
        {
            var headers = responseMessage.Headers.ToString() + responseMessage.Content.Headers.ToString();

            Logger.LogWarning("API call to {RequestUri} returned {Status} ({Reason}).\nHeaders:\n{Headers}\nBody:\n{Body}",
                requestMessage.RequestUri,
                (int)responseMessage.StatusCode,
                responseMessage.ReasonPhrase,
                headers,
                content);
        }

        return responseMessage.IsSuccessStatusCode
            ? content
            : null;
    }
}