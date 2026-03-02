using Microsoft.Extensions.Logging;
using System.Text.Json;
using TornTools.Application.Interfaces;
using TornTools.Core.Enums;
using TornTools.Core.Models.TornKey;

namespace TornTools.Application.Handlers;

public class TornKeyApiCallHandler(
    ILogger<TornKeyApiCallHandler> logger,
    IDatabaseService databaseService
) : ApiCallHandler<TornKeyApiCallHandler>(logger, databaseService)
{
    private long? _userId = null;

    public override ApiCallType CallType => ApiCallType.TornKeyInfo;

    public void SetUserId(long userId)
    {
        _userId = userId;
    }

    public override async Task HandleResponseAsync(string content, CancellationToken stoppingToken)
    {
        if (_userId is null)
        {
            throw new InvalidOperationException("User ID must be set before handling API response.");
        }

        var payload = JsonSerializer.Deserialize<KeyPayload>(content)
            ?? throw new Exception($"Failed to deserialize {nameof(KeyPayload)} from API response.");
        
        if (payload.Error is not null)
        {
            await DatabaseService.MarkKeyUnavailableAsync(_userId.Value, stoppingToken);
        }
    }
}
