using TornTools.Core.DataTransferObjects;

namespace TornTools.Persistence.Interfaces;
public interface IForeignStockItemRepository
{
    Task<IEnumerable<ForeignStockItemDto>> GetItemsAsync(CancellationToken stoppingToken);
    Task UpsertItemsAsync(IEnumerable<ForeignStockItemDto> itemDtos, CancellationToken stoppingToken);
}