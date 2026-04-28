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

  /// <summary>
  /// Optional priority-work hook for subclasses. Return a non-null
  /// QueueItemDto to bypass the normal queue for this tick — used by
  /// TornMarketsProcessor to interleave bargain-alert hot items.
  ///
  /// Items returned here are *synthetic* (not persisted in the queue
  /// table). The worker skips IncrementQueueItemAttempts and
  /// RemoveQueueItemAsync for them. Subclasses are responsible for
  /// pacing — return null on alternate ticks if you don't want to
  /// double the API call rate against the configured rate limit.
  /// </summary>
  protected virtual Task<QueueItemDto?> TryGetPriorityQueueItemAsync(
      IServiceProvider scopedServices,
      CancellationToken ct)
      => Task.FromResult<QueueItemDto?>(null);

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
      var isPriorityWork = false;
      try
      {
        // Priority hook — subclasses can preempt the normal queue.
        // When this returns non-null we skip the queue-table mutations
        // (no Id to increment / remove against).
        try
        {
          queueItem = await TryGetPriorityQueueItemAsync(scope.ServiceProvider, stoppingToken);
          isPriorityWork = queueItem is not null;
        }
        catch (Exception ex)
        {
          _logger.LogError(ex, "[Worker {WorkerId}] {Processor} priority hook threw — falling back to normal queue.", workerId, GetType().Name);
          queueItem = null;
        }

        // Dequeue
        try
        {
          if (queueItem is null)
          {
            queueItem = await databaseService.GetNextQueueItem(CallType, stoppingToken);
          }

          if (!isPriorityWork && queueItem?.Id is null)
          {
            // No Pending items - either other workers hold them, or the queue is exhausted.
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
                else
                {
                  // Another worker is actively processing claimed items for this call type.
                  // Back off briefly so idle workers don't hot-loop on dequeue/check queries.
                  await Task.Delay(500, stoppingToken);
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

        // Priority work has no DB queue id; use Empty as a marker.
        var itemId = isPriorityWork ? Guid.Empty : queueItem!.Id!.Value;

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

        // Priority work isn't a queue row — skip the queue-table
        // mutations, but still fall through to the rate-limit delay
        // at the bottom of the loop. Skipping the delay here would
        // let the alternating snipe-loop double the per-worker call
        // rate vs the configured budget.
        if (isPriorityWork)
        {
          if (!success)
          {
            _logger.LogDebug("[Worker {WorkerId}] {Processor} priority call returned no success. Will retry on the next priority tick.", workerId, GetType().Name);
          }
        }
        else
        {
          // Increment attempt count.
          // If this throws (DB blip, or stoppingToken cancelled mid-call so the
          // attempt update can't run), the row would otherwise stay InProgress
          // forever. Best-effort reset to Pending using CancellationToken.None
          // so we still release the row even during shutdown; the reaper is the
          // last-resort backstop.
          try
          {
            queueItem = await databaseService.IncrementQueueItemAttempts(itemId, stoppingToken);
          }
          catch (Exception ex)
          {
            _logger.LogError(ex, "[Worker {WorkerId}] {Processor} unhandled exception incrementing attempts for {QueueItemId}. Attempting to reset row to Pending.", workerId, GetType().Name, itemId);
            try
            {
              await databaseService.ResetQueueItemToPendingAsync(itemId, CancellationToken.None);
            }
            catch (Exception resetEx)
            {
              _logger.LogError(resetEx, "[Worker {WorkerId}] Failed to reset {QueueItemId} to Pending — the reaper will recover it.", workerId, itemId);
            }
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

      // databaseService is still in scope here - 'using var scope' ends at the bottom of the while block.
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
