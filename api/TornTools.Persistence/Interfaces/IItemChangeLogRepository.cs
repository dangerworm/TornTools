using TornTools.Core.DataTransferObjects;

namespace TornTools.Persistence.Interfaces;
public interface IItemChangeLogRepository
{
    Task<ItemChangeLogDto> CreateItemChangeLogAsync(ItemChangeLogDto itemChangeLogDto, CancellationToken stoppingToken);
    Task<IEnumerable<ItemChangeLogDto>> GetRecentItemChangeLogsAsync(int timeWindowHours, CancellationToken stoppingToken);
}