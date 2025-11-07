using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.DataTransferObjects;

namespace TornTools.Application.Callers;
public abstract class ApiCaller<TCaller>(
    ILogger<TCaller> logger,
    IApiCallHandlerResolver handlerResolver,
    IHttpClientFactory httpClientFactory
)
{
    protected readonly ILogger<TCaller> Logger = logger ?? throw new ArgumentNullException(nameof(logger));
    protected readonly IApiCallHandlerResolver HandlerResolver = handlerResolver ?? throw new ArgumentNullException(nameof(handlerResolver));
    protected readonly IHttpClientFactory HttpClientFactory = httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));

    protected abstract string ClientName { get; }

    protected virtual async Task<bool> CallAsync(QueueItemDto queueItem, CancellationToken stoppingToken)
    {
        var client = HttpClientFactory.CreateClient(ClientName);

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
            var responseMessage = await client.SendAsync(requestMessage, stoppingToken);
            if (!responseMessage.IsSuccessStatusCode)
            {
                Logger.LogWarning("API call for {QueueItem} {Id} returned {Status} ({Reason}).",
                    nameof(QueueItemDto), queueItem.Id, (int)responseMessage.StatusCode, responseMessage.ReasonPhrase);
                return false;
            }

            Logger.LogInformation("API call for {QueueItem} {Id} succeeded.", nameof(QueueItemDto), queueItem.Id);

            var handler = HandlerResolver.GetHandler(queueItem.CallHandler);
            await handler.HandleResponseAsync(responseMessage, stoppingToken);

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

    private static void AddBody(QueueItemDto queueItem, HttpRequestMessage requestMessage)
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
}