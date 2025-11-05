using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.Constants;
using TornTools.Core.DataTransferObjects;
using TornTools.Cron.Enums;

namespace TornTools.Cron.Processors;

public class QueueProcessor(IServiceScopeFactory scopeFactory, ILogger<QueueProcessor> logger) : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory = scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));
    private readonly ILogger<QueueProcessor> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("QueueProcessorService starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var caller = scope.ServiceProvider.GetRequiredService<IApiCaller>();
                var databaseService = scope.ServiceProvider.GetRequiredService<IDatabaseService>();
                var now = DateTimeOffset.UtcNow;

                // Dequeue
                QueueItemDto? item = null;
                try
                {
                    item = await databaseService.GetNextQueueItem(stoppingToken);
                    if (item?.Id is null)
                    {
                        // Queue is empty
                        await Task.Delay(TimeSpan.FromSeconds(QueueProcessorConstants.SecondsToWaitOnEmptyQueue), stoppingToken);
                        continue;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Unhandled exception getting next QueueItem.");
                    continue;
                }

                var itemId = item.Id.Value;

                // Increment attempt count
                try
                {
                    await databaseService.IncrementQueueItemAttempts(itemId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Unhandled exception incrementing attempts for QueueItem {Id}.", itemId);
                    continue;
                }

                // Process
                var success = false;
                try
                {
                    success = await caller.CallAsync(item, stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Unhandled exception processing QueueItem {Id}. Marking for retry.", itemId);
                }

                // Handle failure
                if (!success)
                {
                    if (string.Equals(item.ItemStatus, nameof(QueueStatus.Failed)))
                    {
                        _logger.LogWarning("QueueItem {Id} failed after {Attempts} attempts.",
                            item.Id, item.Attempts);
                    }
                    else
                    {
                        _logger.LogWarning("QueueItem {Id} failed. Will retry at {NextAttemptAt}.",
                            item.Id, item.NextAttemptAt);
                    }
                    continue;
                }

                // Update item status
                try
                {
                    item = await databaseService.SetQueueItemCompleted(itemId);
                    _logger.LogInformation("QueueItem {Id} completed.", itemId);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "QueueItem {Id} completion failed to update.", itemId);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                // graceful shutdown
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "QueueProcessorService loop error.");
                // brief pause to avoid tight crash loop
                await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);
            }

            await Task.Delay(TimeSpan.FromSeconds(QueueProcessorConstants.SecondsPerQueueWorkerIteration), stoppingToken);
        }

        _logger.LogInformation("QueueProcessorService stopping.");
    }
}

