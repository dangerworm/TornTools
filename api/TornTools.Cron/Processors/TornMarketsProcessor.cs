using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.Configurations;
using TornTools.Core.Constants;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;
using TornTools.Persistence.Interfaces;

namespace TornTools.Cron.Processors;

public class TornMarketsProcessor(
    IServiceScopeFactory scopeFactory,
    ILogger<TornMarketsProcessor> logger,
    TornMarketsProcessorConfiguration processorConfig,
    TornApiCallerConfiguration tornApiCallerConfig,
    BargainAlertsConfiguration bargainAlertsConfig
) : QueueProcessorBase(scopeFactory, logger)
{
  private readonly int _workerCount = Math.Max(1, processorConfig.WorkerCount);
  private readonly TornApiCallerConfiguration _tornApiCallerConfig = tornApiCallerConfig;
  private readonly int _maxInterleaves = Math.Max(1, bargainAlertsConfig.MaxInterleaves);

  // Snipe-loop state. Refreshed periodically from the bargain_alerts
  // table. Held in-memory rather than queried per-tick because:
  //   - the active set turns over slowly (alerts open on detection,
  //     close on the next no-qualifying-listing scan or on dismiss)
  //   - querying every tick adds a DB hit to the hot path
  //
  // Guarded by _stateLock — multi-worker case is rare in practice
  // (default WorkerCount=1) but we want correctness if it grows.
  private static readonly TimeSpan HotSetRefreshInterval = TimeSpan.FromSeconds(30);
  private readonly Lock _stateLock = new();
  private DateTimeOffset _hotSetLastSyncedAt = DateTimeOffset.MinValue;
  private HashSet<int> _hotItemIds = [];
  private readonly Dictionary<int, int> _consecutivePollCounts = [];

  // Tick alternation: even ticks return null (let the normal queue
  // advance), odd ticks return a hot item if one is available. Net
  // effect: at most half of API calls go to bargain re-polls, keeping
  // us within the rate budget that GetDelayMillisecondsAsync was sized
  // for. Across multiple workers this still alternates roughly 50/50
  // because the counter is processor-wide.
  private long _tickCounter = 0;

  protected override ApiCallType CallType => ApiCallType.TornMarketListings;
  protected override int WorkerCount => _workerCount;

  protected override Task RepopulateAsync(IDatabaseService db, CancellationToken ct)
      => db.PopulateQueueWithTornMarketItems(ct);

  protected override async Task<int> GetDelayMillisecondsAsync(IDatabaseService db, CancellationToken ct)
  {
    var apiKeyCount = await db.GetApiKeyCountAsync(ct);
    return CalculateDelayMilliseconds(_tornApiCallerConfig.MaxCallsPerMinute, apiKeyCount, _workerCount);
  }

  protected override async Task<QueueItemDto?> TryGetPriorityQueueItemAsync(
      IServiceProvider scopedServices,
      CancellationToken ct)
  {
    await RefreshHotSetIfDueAsync(scopedServices, ct);

    int? hotItemId;
    lock (_stateLock)
    {
      if (_hotItemIds.Count == 0)
      {
        return null;
      }

      // Alternate ticks. Odd = priority opportunity, even = let the
      // normal queue have it. Increment unconditionally so callers
      // can't accidentally skew the cadence by sometimes-not-checking.
      var tick = Interlocked.Increment(ref _tickCounter);
      if (tick % 2 == 0)
      {
        return null;
      }

      // Pick the hot item that has been polled least often this run.
      // With a single hot item this means it always wins until it
      // hits MaxInterleaves; with multiple hot items it round-robins
      // them as their counts equalise.
      int? bestId = null;
      var bestCount = int.MaxValue;
      foreach (var id in _hotItemIds)
      {
        var count = _consecutivePollCounts.GetValueOrDefault(id, 0);
        if (count >= _maxInterleaves)
        {
          continue;
        }
        if (count < bestCount)
        {
          bestId = id;
          bestCount = count;
        }
      }

      if (bestId is null)
      {
        // Every active hot item has hit the interleave bound this
        // run. Stop fast-pathing them — they'll get picked up by the
        // normal queue cycle. Counters reset only when items leave
        // the active set (next refresh) and re-join, so a persistently
        // sticky bargain doesn't keep starving the queue.
        return null;
      }

      _consecutivePollCounts[bestId.Value] =
          _consecutivePollCounts.GetValueOrDefault(bestId.Value, 0) + 1;
      hotItemId = bestId;
    }

    return BuildSyntheticTornMarketQueueItem(hotItemId.Value);
  }

  private async Task RefreshHotSetIfDueAsync(IServiceProvider scopedServices, CancellationToken ct)
  {
    bool refreshNeeded;
    lock (_stateLock)
    {
      refreshNeeded = (DateTimeOffset.UtcNow - _hotSetLastSyncedAt) >= HotSetRefreshInterval;
    }
    if (!refreshNeeded)
    {
      return;
    }

    IReadOnlyCollection<int> ids;
    try
    {
      var alertRepository = scopedServices.GetRequiredService<IBargainAlertRepository>();
      ids = await alertRepository.GetActiveItemIdsAsync(ct);
    }
    catch (Exception)
    {
      // Keep the previous set on failure — better stale than empty.
      lock (_stateLock)
      {
        _hotSetLastSyncedAt = DateTimeOffset.UtcNow;
      }
      throw;
    }

    lock (_stateLock)
    {
      var fresh = new HashSet<int>(ids);
      // Drop counters for items that have left the active set so a
      // re-opening bargain gets a fresh interleave budget.
      var removed = _consecutivePollCounts.Keys
          .Where(k => !fresh.Contains(k))
          .ToList();
      foreach (var key in removed)
      {
        _consecutivePollCounts.Remove(key);
      }
      _hotItemIds = fresh;
      _hotSetLastSyncedAt = DateTimeOffset.UtcNow;
    }
  }

  // Mirrors DatabaseService.BuildTornMarketQueueItem but without an
  // Id — the synthetic item never enrols in the queue table. The
  // caller in QueueProcessorBase explicitly skips queue-table writes
  // for priority work.
  private static QueueItemDto BuildSyntheticTornMarketQueueItem(int itemId)
  {
    return new QueueItemDto
    {
      CallType = ApiCallType.TornMarketListings,
      EndpointUrl = string.Format(TornApiConstants.ItemListings, itemId),
      HttpMethod = "GET",
    };
  }
}
