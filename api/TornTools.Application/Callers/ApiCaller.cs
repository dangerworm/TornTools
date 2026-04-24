using Microsoft.Extensions.Logging;
using System.Text;
using System.Text.Json;
using TornTools.Application.Exceptions;
using TornTools.Application.Interfaces;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;

namespace TornTools.Application.Callers;

public abstract class ApiCaller<TCaller>(
    ILogger<TCaller> logger,
    IDatabaseService databaseService,
    IHttpClientFactory httpClientFactory
)
{
  protected readonly ILogger<TCaller> Logger = logger ?? throw new ArgumentNullException(nameof(logger));
  protected readonly IDatabaseService DatabaseService = databaseService ?? throw new ArgumentNullException(nameof(databaseService));
  protected readonly IHttpClientFactory HttpClientFactory = httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));

  public abstract IEnumerable<ApiCallType> CallTypes { get; }
  protected abstract string ClientName { get; }

  protected virtual async Task<bool> CallAsync(QueueItemDto queueItem, IApiCallHandler handler, CancellationToken stoppingToken)
  {
    using var client = HttpClientFactory.CreateClient(ClientName);

    using var requestMessage = new HttpRequestMessage(
        new HttpMethod(queueItem.HttpMethod ?? "GET"),
        queueItem.EndpointUrl
    );

    // Track which key (and therefore which user) this request is using, so a
    // TornKeyUnavailableException can be attributed to the right owner.
    ApiKeyLeaseDto? lease = null;
    if (queueItem.HeadersJson is null || !queueItem.HeadersJson.ContainsKey("Authorization"))
    {
      lease = await AddAuthorizationHeader(requestMessage, stoppingToken);
    }

    await AddQueueItemHeaders(requestMessage, queueItem, stoppingToken);

    AddBody(queueItem, requestMessage);

    try
    {
      var content = await Fetch(client, requestMessage, stoppingToken);
      if (content is null)
      {
        Logger.LogWarning("API call for {QueueItem} {Id} failed.", nameof(QueueItemDto), queueItem.Id);
        return false;
      }

      await handler.HandleResponseAsync(queueItem, content, stoppingToken);

      return true;
    }
    catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
    {
      // shutting down
      return false;
    }
    catch (Exception ex)
    {
      var apiKeyHint = lease is null
          ? "no-key call"
          : lease.ApiKey.Length > 4
              ? $"user {lease.UserId} key {lease.ApiKey[..4]}****"
              : $"user {lease.UserId}";

      if (ex is TornKeyUnavailableException exception && lease is not null)
      {
        Logger.LogWarning(
            "API key for {ApiKeyHint} is unavailable (code {ErrorCode}). Marking as unavailable.",
            apiKeyHint,
            exception.ErrorCode
        );
        await DatabaseService.MarkKeyUnavailableAsync(lease.UserId, stoppingToken);
        return false;
      }

      Logger.LogError(
          ex,
          "API call for {QueueItem} {Id} using {ApiKeyHint} failed.",
          nameof(QueueItemDto),
          queueItem.Id,
          apiKeyHint
      );

      return false;
    }
  }

  // Subclasses that use an authenticated key return the lease so the base
  // class can attribute failures back to the right user. Callers that don't
  // need a key inherit the default (no-op, null lease).
  protected virtual Task<ApiKeyLeaseDto?> AddAuthorizationHeader(HttpRequestMessage requestMessage, CancellationToken stoppingToken)
  {
    return Task.FromResult<ApiKeyLeaseDto?>(null);
  }

  protected virtual Task AddQueueItemHeaders(HttpRequestMessage requestMessage, QueueItemDto queueItem, CancellationToken stoppingToken)
  {
    if (queueItem.HeadersJson is not null)
    {
      foreach (var kvp in queueItem.HeadersJson)
      {
        // TryAddWithoutValidation avoids format exceptions on custom headers
        requestMessage.Headers.TryAddWithoutValidation(kvp.Key, kvp.Value);
      }
    }

    return Task.CompletedTask;
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

    // Error payloads from Torn aren't big, so read it here for logging even on non-success status codes.
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