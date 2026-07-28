using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.Configurations;
using TornTools.Core.Enums;

namespace TornTools.Cron.Processors;

public class TornItemsProcessor(
    IServiceScopeFactory scopeFactory,
    ILogger<TornItemsProcessor> logger,
    TornApiCallerConfiguration tornApiCallerConfig
) : QueueProcessorBase(scopeFactory, logger)
{
  private readonly TornApiCallerConfiguration _tornApiCallerConfig = tornApiCallerConfig;

  // The full-item-list endpoint is a single global call. One worker is
  // correct: parallelism gives nothing here and would risk concurrent
  // item-table upserts.
  protected override ApiCallType CallType => ApiCallType.TornItems;
  protected override int WorkerCount => 1;

  // Intentionally a no-op. Unlike the market processors, TornItems queue
  // items are not derived by scanning the DB - they are enqueued
  // externally by Program.cs at cold start (when the items table is empty)
  // and by the Hangfire ItemUpdate job on a schedule. Auto-repopulating
  // here would poll the items endpoint continuously instead of on that
  // cadence. This processor's only job is to claim and process the rows
  // those two producers create.
  protected override Task RepopulateAsync(IDatabaseService db, CancellationToken ct)
      => Task.CompletedTask;

  // Governs both the post-call pace and the idle poll interval. Reuse the
  // shared Torn rate budget so a burst of item calls can't starve the
  // market processor's budget.
  protected override async Task<int> GetDelayMillisecondsAsync(IDatabaseService db, CancellationToken ct)
  {
    var apiKeyCount = await db.GetApiKeyCountAsync(ct);
    return CalculateDelayMilliseconds(_tornApiCallerConfig.MaxCallsPerMinute, apiKeyCount, 1);
  }
}
