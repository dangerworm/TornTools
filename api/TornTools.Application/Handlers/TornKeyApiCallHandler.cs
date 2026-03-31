using Microsoft.Extensions.Logging;
using System.Text.Json;
using TornTools.Application.Interfaces;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;
using TornTools.Core.Models.TornKey;

namespace TornTools.Application.Handlers;

public class TornKeyApiCallHandler(
    ILogger<TornKeyApiCallHandler> logger,
    IDatabaseService databaseService
) : ApiCallHandler<TornKeyApiCallHandler>(logger, databaseService)
{
  public override ApiCallType CallType => ApiCallType.TornKeyInfo;

  public override async Task HandleResponseAsync(QueueItemDto item, string content, CancellationToken stoppingToken)
  {
    if (item.PayloadJson is null ||
        !item.PayloadJson.TryGetValue("UserId", out var userIdString) ||
        !long.TryParse(userIdString, out var userId))
    {
      throw new InvalidOperationException("UserId must be present in the queue item payload.");
    }

    var payload = JsonSerializer.Deserialize<KeyPayload>(content)
        ?? throw new Exception($"Failed to deserialize {nameof(KeyPayload)} from API response.");

    if (payload.Error?.ErrorMessage is not null && payload.Error.ErrorMessage.Equals("Incorrect key", StringComparison.OrdinalIgnoreCase))
    {
      Logger.LogWarning("API key for user {UserId} is incorrect or cancelled. Marking as unavailable.", userId);
      await DatabaseService.MarkKeyUnavailableAsync(userId, stoppingToken);
    }
  }
}
