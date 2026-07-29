using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;

namespace TornTools.Persistence.Interfaces;

public interface IItemChangeLogRepository
{
  Task<ItemChangeLogDto> CreateItemChangeLogAsync(ItemChangeLogDto itemChangeLogDto, CancellationToken stoppingToken);
  Task<DateTimeOffset?> GetEarliestChangeTimeAsync(CancellationToken stoppingToken);
  Task<int> PruneOlderThanAsync(DateTimeOffset olderThan, TimeSpan chunk, CancellationToken stoppingToken);
  Task<IEnumerable<ItemHistoryPointDto>> GetItemPriceHistoryAsync(int itemId, HistoryWindow window, Source source, CancellationToken stoppingToken);
  Task<IEnumerable<ItemHistoryPointDto>> GetItemVelocityHistoryAsync(int itemId, HistoryWindow window, Source source, CancellationToken stoppingToken);
}