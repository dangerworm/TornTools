using TornTools.Core.DataTransferObjects;

namespace TornTools.Persistence.Interfaces;

public interface IItemChangeLogSummaryRepository
{
  Task BuildSummariesAsync(DateTimeOffset fromBucket, DateTimeOffset toBucket, double bucketSeconds, CancellationToken stoppingToken);
  Task<DateTimeOffset?> GetLatestBucketStartAsync(CancellationToken stoppingToken);
  Task<IEnumerable<ItemHistoryPointDto>> GetPriceHistoryAsync(int itemId, DateTimeOffset from, DateTimeOffset to, double aggregateBucketSeconds, CancellationToken stoppingToken);
  Task<IEnumerable<ItemHistoryPointDto>> GetVelocityHistoryAsync(int itemId, DateTimeOffset from, DateTimeOffset to, double aggregateBucketSeconds, CancellationToken stoppingToken);
}
