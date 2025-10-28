using Microsoft.EntityFrameworkCore.Internal;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core;
using TornTools.Cron.Enums;

namespace TornTools.Application.Services;


public class QueueProcessor : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<QueueProcessor> _logger;

    public QueueProcessor(IServiceScopeFactory scopeFactory, ILogger<QueueProcessor> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("QueueProcessorService starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<TornToolsDbContext>();
                var handler = scope.ServiceProvider.GetRequiredService<IApiCallHandler>();

                var now = DateTimeOffset.UtcNow;

                // Find a candidate (oldest pending whose NextAttemptAt is due or null)
                var candidate = await db.QueueItems
                    .Where(q => q.Status == QueueStatus.Pending &&
                               (q.NextAttemptAt == null || q.NextAttemptAt <= now))
                    .OrderBy(q => q.CreatedAt)
                    .FirstOrDefaultAsync(stoppingToken);

                if (candidate is null)
                {
                    await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken);
                    continue;
                }

                // Attempt to "claim" the item by moving it to InProgress with a concurrency check
                candidate.Status = QueueStatus.InProgress;
                var originalRowVersion = candidate.RowVersion;

                try
                {
                    await db.SaveChangesAsync(stoppingToken); // if someone else grabbed it, this will fail later via concurrency
                }
                catch (DbUpdateConcurrencyException)
                {
                    // Another worker took it—just try again
                    _logger.LogDebug("Concurrency claim failed for QueueItem {Id}. Retrying.", candidate.Id);
                    continue;
                }

                // Process
                try
                {
                    var success = await handler.ProcessAsync(candidate, stoppingToken);
                    var db2 = scope.ServiceProvider.GetRequiredService<TornToolsDbContext>(); // fresh context or same scope

                    var item = _dbService.IncrementQueueItemAttempts(candidate.Id);
                    if (item is null) continue;

                    if (success)
                    {
                        item.Status = _dbService.SetQueueItemCompleted(candidate.Id);
                        _logger.LogInformation("QueueItem {Id} completed.", item.Id);
                    }
                    else
                    {

                        if (item.Status == QueueStatus.Failed)
                        {
                            _logger.LogWarning("QueueItem {Id} failed after {Attempts} attempts.", item.Id, item.Attempts);
                        }
                        else
                        {
                            _logger.LogWarning("QueueItem {Id} failed. Will retry at {NextAttemptAt}.",
                                item.Id, item.NextAttemptAt);
                        }
                    }

                    await db2.SaveChangesAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Unhandled exception processing QueueItem {Id}. Marking for retry.", candidate.Id);

                    try { 
                        _dbService.IncrementQueueItemAttempts(candidate.Id);
                    } 
                    catch 
                    {
                        /* swallow */ 
                    }
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

            // Fixed tick of ~1s per loop
            await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken);
        }

        _logger.LogInformation("QueueProcessorService stopping.");
    }
}

