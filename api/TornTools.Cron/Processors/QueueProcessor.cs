using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.Configurations;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;
using TornTools.Cron.Enums;

namespace TornTools.Cron.Processors;

public class QueueProcessor(
    IServiceScopeFactory scopeFactory,
    ILogger<QueueProcessor> logger,
    QueueProcessorConfiguration processorConfig
) : BackgroundService
{
  private readonly IServiceScopeFactory _scopeFactory = scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));
  private readonly ILogger<QueueProcessor> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
  private readonly int _workerCount = Math.Max(1, processorConfig.WorkerCount);

  // Serialises queue repopulation so only one worker clears + refills at a time.
  private static readonly SemaphoreSlim _repopulateLock = new(1, 1);

  protected override async Task ExecuteAsync(CancellationToken stoppingToken)
  {
    _logger.LogInformation("QueueProcessor starting with {WorkerCount} workers.", _workerCount);

    var workers = Enumerable.Range(0, _workerCount)
        .Select(i => RunWorkerAsync(i, stoppingToken));

    await Task.WhenAll(workers);

    _logger.LogInformation("QueueProcessor stopping.");
  }

  private async Task RunWorkerAsync(int workerId, CancellationToken stoppingToken)
  {
    while (!stoppingToken.IsCancellationRequested)
    {
      using var scope = _scopeFactory.CreateScope();
      var callerResolver = scope.ServiceProvider.GetRequiredService<IApiCallerResolver>();
      var callHandlerResolver = scope.ServiceProvider.GetRequiredService<IApiCallHandlerResolver>();
      var databaseService = scope.ServiceProvider.GetRequiredService<IDatabaseService>();
      var tornApiCallerOptions = scope.ServiceProvider.GetRequiredService<TornApiCallerConfiguration>();
      var weav3rApiCallerOptions = scope.ServiceProvider.GetRequiredService<Weav3rApiCallerConfiguration>();

      QueueItemDto? queueItem = null;
      try
      {
        // Dequeue
        try
        {
          queueItem = await databaseService.GetNextQueueItem(stoppingToken);

          if (queueItem?.Id is null)
          {
            // Queue is empty (or all items are InProgress/Failed) — repopulate.
            // Only one worker does this at a time; others wait briefly and retry.
            if (await _repopulateLock.WaitAsync(0, stoppingToken))
            {
              try
              {
                await databaseService.RemoveQueueItemsAsync(stoppingToken);
                await databaseService.PopulateQueueWithMarketAndWeav3rItemsOfInterest(stoppingToken);
              }
              finally
              {
                _repopulateLock.Release();
              }
            }
            else
            {
              await Task.Delay(500, stoppingToken);
            }
            continue;
          }
        }
        catch (Exception ex)
        {
          _logger.LogError(ex, "[Worker {WorkerId}] Unhandled exception getting next {QueueItem}.", workerId, nameof(QueueItemDto));
          continue;
        }

        var itemId = queueItem.Id.Value;

        // Process
        IApiCaller caller;
        var success = false;
        try
        {
          caller = callerResolver.GetCaller(queueItem.CallType);
          var handler = callHandlerResolver.GetHandler(queueItem.CallType);
          success = await caller.CallAsync(queueItem, handler, stoppingToken);
        }
        catch (Exception ex)
        {
          _logger.LogError(ex, "[Worker {WorkerId}] Unhandled exception processing {QueueItem} {Id}. Marking for retry.", workerId, nameof(QueueItemDto), itemId);
        }

        // Increment attempt count
        try
        {
          queueItem = await databaseService.IncrementQueueItemAttempts(itemId, stoppingToken);
        }
        catch (Exception ex)
        {
          _logger.LogError(ex, "[Worker {WorkerId}] Unhandled exception incrementing attempts for {QueueItem} {Id}.", workerId, nameof(QueueItemDto), itemId);
          continue;
        }

        // Handle failure
        if (!success)
        {
          if (string.Equals(queueItem.ItemStatus, nameof(QueueStatus.Failed)))
          {
            _logger.LogWarning("[Worker {WorkerId}] {QueueItem} {Id} failed after {Attempts} attempts.",
                workerId, nameof(QueueItemDto), queueItem.Id, queueItem.Attempts);
          }
          else
          {
            _logger.LogWarning("[Worker {WorkerId}] {QueueItem} {Id} failed. Will retry at {NextAttemptAt}.",
                workerId, nameof(QueueItemDto), queueItem.Id, queueItem.NextAttemptAt);
          }
          continue;
        }

        // Remove completed item
        try
        {
          await databaseService.RemoveQueueItemAsync(itemId, stoppingToken);
        }
        catch (Exception ex)
        {
          _logger.LogWarning(ex, "[Worker {WorkerId}] Removal of {QueueItem} {Id} failed.", workerId, nameof(QueueItemDto), itemId);
        }
      }
      catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
      {
        // Graceful shutdown
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "[Worker {WorkerId}] {QueueProcessor} loop error.", workerId, nameof(QueueProcessor));
        await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);
      }

      int delayMilliseconds = 100;
      if (queueItem?.CallType == ApiCallType.TornMarketListings)
      {
        var apiKeyCount = await databaseService.GetApiKeyCountAsync(stoppingToken);
        delayMilliseconds = CalculateDelayBetweenCallsMilliseconds(tornApiCallerOptions.MaxCallsPerMinute, apiKeyCount);
      }
      else if (queueItem?.CallType == ApiCallType.Weav3rBazaarListings)
      {
        delayMilliseconds = CalculateDelayBetweenCallsMilliseconds(weav3rApiCallerOptions.MaxCallsPerMinute);
      }

      await Task.Delay(TimeSpan.FromMilliseconds(delayMilliseconds), stoppingToken);
    }
  }

  private static int CalculateDelayBetweenCallsMilliseconds(int maxCallsPerMinute, int apiKeyCount = 1)
  {
    if (apiKeyCount < 1)
    {
      throw new ArgumentOutOfRangeException(nameof(apiKeyCount), "API key count must be greater than zero.");
    }

    var maxCallsPerMinuteReduced = (int)Math.Floor(maxCallsPerMinute * 0.8);
    var callsPerMinute = maxCallsPerMinuteReduced * apiKeyCount;
    var delayInMilliseconds = 60000.0 / callsPerMinute;
    return (int)Math.Ceiling(delayInMilliseconds);
  }
}
