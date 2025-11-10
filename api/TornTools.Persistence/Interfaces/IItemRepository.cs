using TornTools.Core.DataTransferObjects;

namespace TornTools.Persistence.Interfaces;
public interface IItemRepository
{
    Task<ItemDto> CreateItemAsync(ItemDto itemDto, CancellationToken stoppingToken);
    Task<ItemDto> UpsertItemAsync(ItemDto itemDto, CancellationToken stoppingToken);
    Task UpsertItemsAsync(IEnumerable<ItemDto> itemDtos, CancellationToken stoppingToken);
    Task<int> GetNumberOfItemsAsync(CancellationToken stoppingToken);
    Task<IEnumerable<ItemDto>> GetAllItemsAsync(CancellationToken stoppingToken);
    Task<ItemDto> GetItemAsync(int id, CancellationToken stoppingToken);
}