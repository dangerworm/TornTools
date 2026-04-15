using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.Configurations;
using TornTools.Core.Enums;

namespace TornTools.Cron.Processors;

public class TornMarketsProcessor(
    IServiceScopeFactory scopeFactory,
    ILogger<TornMarketsProcessor> logger,
    TornMarketsProcessorConfiguration processorConfig,
    TornApiCallerConfiguration tornApiCallerConfig
) : QueueProcessorBase(scopeFactory, logger)
{
  private readonly int _workerCount = Math.Max(1, processorConfig.WorkerCount);
  private readonly TornApiCallerConfiguration _tornApiCallerConfig = tornApiCallerConfig;

  protected override ApiCallType CallType => ApiCallType.TornMarketListings;
  protected override int WorkerCount => _workerCount;

  protected override Task RepopulateAsync(IDatabaseService db, CancellationToken ct)
      => db.PopulateQueueWithTornMarketItems(ct);

  protected override async Task<int> GetDelayMillisecondsAsync(IDatabaseService db, CancellationToken ct)
  {
    var apiKeyCount = await db.GetApiKeyCountAsync(ct);
    return CalculateDelayMilliseconds(_tornApiCallerConfig.MaxCallsPerMinute, apiKeyCount, _workerCount);
  }
}
