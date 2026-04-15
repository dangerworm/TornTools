using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;
using TornTools.Cron.Enums;

namespace TornTools.Cron.Processors;

/// <summary>
/// Abstract base for call-type-specific queue processors.
/// Each subclass owns one ApiCallType and runs N workers. Workers within a
/// processor share a repopulate lock so only one clears and refills at a time;
/// processors of different types never contend because each filters the queue
/// by its own call type.
/// </summary>
public abstract class QueueProcessorBase(
    IServiceScopeFactory scopeFactory,
    ILogger logger
) : BackgroundService
{
  private readonly IServiceScopeFactory _scopeFactory = scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));
  private readonly ILogger _logger = logger ?? throw new ArgumentNullException(nameof(logger));
  private readonly SemaphoreSlim _repopulateLock = new(1, 1);

  protected abstract ApiCallType CallType { get; }
  protected abstract int WorkerCount { get; }

  /// <summary>Populate the queue for this processor's call type.</summary>
  protected abstract Task RepopulateAsync(IDatabaseService db, CancellationToken ct);

  /// <summary>Return the per-worker inter-call delay in milliseconds.</summary>
  protected abstract Task<int> GetDelayMillisecondsAsync(IDatabaseService db, CancellationToken ct);

  protected override async Task ExecuteAsync(CancellationToken stoppingToken)
  {
    _logger.LogInformation("{Processor} starting with {WorkerCount} workers.", GetType().Name, WorkerCount);

    var workers = Enumerable.Range(0, WorkerCount)
        .Select(i => RunWorkerAsync(i, stoppingToken));

    await Task.WhenAll(workers);

    _logger.LogInformation("{Processor} stopping.", GetType().Name);
  }

  private async Task RunWorkerAsync(int workerId, CancellationToken stoppingToken)
  {
    while (!stoppingToken.IsCancellationRequested)
    {
      using var scope = _scopeFactory.CreateScope();
      var callerResolver = scope.ServiceProvider.GetRequiredService<IApiCallerResolver>();
      var callHandlerResolver = scope.ServiceProvider.GetRequiredService<IApiCallHandlerResolver>();
      var databaseService = scope.ServiceProvider.GetRequiredService<IDatabaseService>();

      QueueItemDto? queueItem = null;
      try
      {
        // Dequeue
        try
        {
          queueItem = await databaseService.GetNextQueueItem(CallType, stoppingToken);

          if (queueItem?.Id is null)
          {
            // No Pending items — either other workers hold them, or the queue is exhausted.
            // Repopulate only once all in-flight work for this call type has landed.
            if (await _repopulateLock.WaitAsync(0, stoppingToken))
            {
              try
              {
                if (!await databaseService.HasInProgressItems(CallType, stoppingToken))
                {
                  await databaseService.RemoveQueueItemsAsync(CallType, stoppingToken);
                  await RepopulateAsync(databaseService, stoppingToken);
                }
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
          _logger.LogError(ex, "[Worker {WorkerId}] {Processor} unhandled exception getting next queue item.", workerId, GetType().Name);
          continue;
        }

        var itemId = queueItem.Id.Value;

        // Process
        var success = false;
        try
        {
          var caller = callerResolver.GetCaller(queueItem.CallType);
          var handler = callHandlerResolver.GetHandler(queueItem.CallType);
          success = await caller.CallAsync(queueItem, handler, stoppingToken);
        }
        catch (Exception ex)
        {
          _logger.LogError(ex, "[Worker {WorkerId}] {Processor} unhandled exception processing {QueueItemId}. Marking for retry.", workerId, GetType().Name, itemId);
        }

        // Increment attempt count
        try
        {
          queueItem = await databaseService.IncrementQueueItemAttempts(itemId, stoppingToken);
        }
        catch (Exception ex)
        {
          _logger.LogError(ex, "[Worker {WorkerId}] {Processor} unhandled exception incrementing attempts for {QueueItemId}.", workerId, GetType().Name, itemId);
          continue;
        }

        // Handle failure
        if (!success)
        {
          if (string.Equals(queueItem.ItemStatus, nameof(QueueStatus.Failed)))
          {
            _logger.LogWarning("[Worker {WorkerId}] {QueueItemId} failed after {Attempts} attempts.",
                workerId, queueItem.Id, queueItem.Attempts);
          }
          else
          {
            _logger.LogWarning("[Worker {WorkerId}] {QueueItemId} failed. Will retry at {NextAttemptAt}.",
                workerId, queueItem.Id, queueItem.NextAttemptAt);
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
          _logger.LogWarning(ex, "[Worker {WorkerId}] Removal of {QueueItemId} failed.", workerId, itemId);
        }
      }
      catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
      {
        // Graceful shutdown
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "[Worker {WorkerId}] {Processor} loop error.", workerId, GetType().Name);
        await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);
      }

      // databaseService is still in scope here — 'using var scope' ends at the bottom of the while block.
      var delayMilliseconds = 100;
      try { delayMilliseconds = await GetDelayMillisecondsAsync(databaseService, stoppingToken); }
      catch { /* keep default */ }

      await Task.Delay(TimeSpan.FromMilliseconds(delayMilliseconds), stoppingToken);
    }
  }

  /// <summary>
  /// Each worker sleeps for (aggregate target interval × workerCount) so the
  /// combined throughput of all workers stays within the configured rate limit.
  /// </summary>
  protected static int CalculateDelayMilliseconds(int maxCallsPerMinute, int apiKeyCount, int workerCount)
  {
    if (apiKeyCount < 1)
      throw new ArgumentOutOfRangeException(nameof(apiKeyCount), "API key count must be greater than zero.");

    var maxCallsPerMinuteReduced = (int)Math.Floor(maxCallsPerMinute * 0.8);
    var callsPerMinute = maxCallsPerMinuteReduced * apiKeyCount;
    return (int)Math.Ceiling(60000.0 * workerCount / callsPerMinute);
  }
}
