using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.Configurations;
using TornTools.Core.Enums;

namespace TornTools.Cron.Processors;

public class Weav3rBazaarsProcessor(
    IServiceScopeFactory scopeFactory,
    ILogger<Weav3rBazaarsProcessor> logger,
    Weav3rBazaarsProcessorConfiguration processorConfig,
    Weav3rApiCallerConfiguration weav3rApiCallerConfig
) : QueueProcessorBase(scopeFactory, logger)
{
  // Weav3rPythonServer uses a SemaphoreSlim(1,1) to serialise calls to the Python process,
  // so multiple workers do not increase Weav3r throughput - they just queue behind the lock.
  // Keep WorkerCount = 1 unless the Python server is replaced with a concurrent alternative.
  private readonly int _workerCount = Math.Max(1, processorConfig.WorkerCount);
  private readonly Weav3rApiCallerConfiguration _weav3rApiCallerConfig = weav3rApiCallerConfig;

  protected override ApiCallType CallType => ApiCallType.Weav3rBazaarListings;
  protected override int WorkerCount => _workerCount;

  protected override Task RepopulateAsync(IDatabaseService db, CancellationToken ct)
      => db.PopulateQueueWithWeav3rItems(ct);

  protected override Task<int> GetDelayMillisecondsAsync(IDatabaseService db, CancellationToken ct)
      => Task.FromResult(CalculateDelayMilliseconds(_weav3rApiCallerConfig.MaxCallsPerMinute, 1, _workerCount));
}
