using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;

namespace TornTools.Persistence.Interfaces;

public enum VolatilitySortKey
{
  Changes1d,
  Changes1w,
  PriceChange1d,
  PriceChange1w,
}

public interface IItemVolatilityStatsRepository
{
  // Re-computes stats for every (item_id, source) pair from the change-log
  // summaries. Invoked by the scheduled Hangfire job. Upserts by primary key.
  Task RebuildStatsAsync(CancellationToken stoppingToken);

  // Returns the top `limit` rows for the given source, sorted descending by
  // `sortKey`. Descending is chosen explicitly so you can surface "biggest
  // risers" via PriceChange1d, "most active" via Changes1d, etc.
  Task<IEnumerable<ItemVolatilityStatsDto>> GetTopAsync(
      Source source,
      VolatilitySortKey sortKey,
      int limit,
      bool ascending,
      CancellationToken stoppingToken);
}
