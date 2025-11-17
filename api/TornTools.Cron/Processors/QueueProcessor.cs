using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.Configurations;
using TornTools.Core.Constants;
using TornTools.Core.DataTransferObjects;
using TornTools.Cron.Enums;

namespace TornTools.Cron.Processors;

public class QueueProcessor(
    IServiceScopeFactory scopeFactory, 
    ILogger<QueueProcessor> logger
) : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory = scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));
    private readonly ILogger<QueueProcessor> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("QueueProcessorService starting.");

        using var scope = _scopeFactory.CreateScope();
        var callerResolver = scope.ServiceProvider.GetRequiredService<IApiCallerResolver>();
        var databaseService = scope.ServiceProvider.GetRequiredService<IDatabaseService>();
        var tornApiCallerOptions = scope.ServiceProvider.GetRequiredService<TornApiCallerConfiguration>();

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var now = DateTime.UtcNow;

                // Dequeue
                QueueItemDto? queueItem = null;
                try
                {
                    queueItem = await databaseService.GetNextQueueItem(stoppingToken);
                    if (queueItem?.Id is null)
                    {
                        // Queue only has InProgress or Failed items, so repopulate
                        await databaseService.RemoveQueueItemsAsync(stoppingToken);
                        await databaseService.PopulateQueue(stoppingToken);
                        continue;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Unhandled exception getting next {QueueItem}.", nameof(QueueItemDto));
                    continue;
                }

                var itemId = queueItem.Id.Value;

                // Process
                var success = false;
                try
                {
                    var caller = callerResolver.GetCaller(queueItem.CallType);
                    success = await caller.CallAsync(queueItem, stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Unhandled exception processing {QueueItem} {Id}. Marking for retry.", nameof(QueueItemDto), itemId);
                }

                // Increment attempt count
                try
                {
                    queueItem = await databaseService.IncrementQueueItemAttempts(itemId, stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Unhandled exception incrementing attempts for {QueueItem} {Id}.", nameof(QueueItemDto), itemId);
                    continue;
                }

                // Handle failure
                if (!success)
                {
                    if (string.Equals(queueItem.ItemStatus, nameof(QueueStatus.Failed)))
                    {
                        _logger.LogWarning("{QueueItem} {Id} failed after {Attempts} attempts.",
                            nameof(QueueItemDto), queueItem.Id, queueItem.Attempts);
                    }
                    else
                    {
                        _logger.LogWarning("{QueueItem} {Id} failed. Will retry at {NextAttemptAt}.",
                            nameof(QueueItemDto), queueItem.Id, queueItem.NextAttemptAt);
                    }
                    continue;
                }

                // Update item status
                try
                {
                    await databaseService.RemoveQueueItemAsync(itemId, stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Removal of {QueueItem} {Id} failed.", nameof(QueueItemDto), itemId);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                // Graceful shutdown
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "{QueueProcessor} loop error.", nameof(QueueProcessor));
                // Brief pause to avoid tight crash loop
                await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);
            }

            var apiKeyCount = await databaseService.GetApiKeyCountAsync(stoppingToken);
            var delayMilliseconds = CalculateDelayBetweenCallsMilliseconds(tornApiCallerOptions, apiKeyCount);

            await Task.Delay(TimeSpan.FromMilliseconds(delayMilliseconds), stoppingToken);
        }

        _logger.LogInformation("{QueueProcessor} stopping.", nameof(QueueProcessor));
    }

    private static int CalculateDelayBetweenCallsMilliseconds(TornApiCallerConfiguration tornApiCallerOptions, int apiKeyCount)
    {
        if (apiKeyCount < 1)
        {
            throw new ArgumentOutOfRangeException(nameof(apiKeyCount), "API key count must be greater than zero.");
        }

        var maxCallsPerMinuteReduced = (int)Math.Floor(tornApiCallerOptions.MaxCallsPerMinute * 0.8);
        var callsPerMinute = maxCallsPerMinuteReduced * apiKeyCount;
        var delayInMilliseconds = 60000.0 / callsPerMinute;
        return (int)Math.Ceiling(delayInMilliseconds);
    }
}

