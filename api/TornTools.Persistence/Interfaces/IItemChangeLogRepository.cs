using TornTools.Core.DataTransferObjects;

namespace TornTools.Persistence.Interfaces;
public interface IItemChangeLogRepository
{
    Task<ItemChangeLogDto> CreateItemChangeLogAsync(ItemChangeLogDto itemChangeLogDto, CancellationToken stoppingToken);
}