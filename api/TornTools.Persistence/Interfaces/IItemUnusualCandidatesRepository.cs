using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;

namespace TornTools.Persistence.Interfaces;

public interface IItemUnusualCandidatesRepository
{
  // Recompute unusual-activity stats for every (item_id, source) from
  // the change-log summaries. Multi-horizon (1h / 6h / 24h / 7d) plus
  // shared 30d trimmed-median baseline + dispersion. UPSERTs by PK.
  Task RebuildAsync(CancellationToken stoppingToken);

  // Top N items for a source, ordered by unusualness_score (max |z|
  // across horizons that met their min-sample threshold). Filters out
  // items below `minScore`.
  Task<IEnumerable<ItemUnusualCandidateDto>> GetTopAsync(
      Source source,
      int limit,
      decimal minScore,
      CancellationToken stoppingToken);
}
