using TornTools.Core.DataTransferObjects;

namespace TornTools.Persistence.Interfaces;

public interface IItemRepository
{
  Task<ItemDto> CreateItemAsync(ItemDto itemDto, CancellationToken stoppingToken);
  Task UpsertItemsAsync(IEnumerable<ItemDto> itemDtos, CancellationToken stoppingToken);
  Task<IEnumerable<ItemDto>> GetAllItemsAsync(CancellationToken stoppingToken);
  Task<int> GetNumberOfItemsAsync(CancellationToken stoppingToken);
  Task<IEnumerable<ProfitableListingDto>> GetProfitableItemsAsync(CancellationToken stoppingToken);
  Task<IEnumerable<ItemDto>> GetMarketItemsAsync(CancellationToken stoppingToken);
  Task<IEnumerable<(int ItemId, string Source)>> GetStaleMarketItemIdsAsync(int thresholdHours, CancellationToken stoppingToken);
  Task<IEnumerable<int>> GetActiveMarketItemsForQueueAsync(int minChangesIn7Days, CancellationToken stoppingToken);
  Task<ItemDto> GetItemAsync(int id, CancellationToken stoppingToken);
}