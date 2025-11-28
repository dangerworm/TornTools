using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;

namespace TornTools.Persistence.Interfaces;
public interface IItemChangeLogRepository
{
    Task<ItemChangeLogDto> CreateItemChangeLogAsync(ItemChangeLogDto itemChangeLogDto, CancellationToken stoppingToken);
    Task<IEnumerable<ItemChangeLogDto>> GetRecentItemChangeLogsAsync(int timeWindowHours, CancellationToken stoppingToken);
    Task<IEnumerable<ItemHistoryPointDto>> GetItemPriceHistoryAsync(int itemId, HistoryWindow window, CancellationToken stoppingToken);
    Task<IEnumerable<ItemHistoryPointDto>> GetItemVelocityHistoryAsync(int itemId, HistoryWindow window, CancellationToken stoppingToken);
}