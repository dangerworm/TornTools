using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;
using TornTools.Core.Models.InputModels;
using TornTools.Cron.Enums;

namespace TornTools.Application.Interfaces;
public interface IDatabaseService
{
    Task<IEnumerable<ForeignStockItemDto>> GetForeignStockItemsAsync(CancellationToken cancellationToken);
    Task UpsertForeignStockItemsAsync(IEnumerable<ForeignStockItemDto> items, CancellationToken stoppingToken);

    Task CreateItemChangeLogAsync(ItemChangeLogDto changeLogDto, CancellationToken stoppingToken);

    Task<IEnumerable<ItemDto>> GetAllItemsAsync(CancellationToken stoppingToken);
    Task<int> GetNumberOfItemsAsync(CancellationToken stoppingToken);
    Task UpsertItemsAsync(IEnumerable<ItemDto> items, CancellationToken stoppingToken);
    
    Task CreateListingsAsync(IEnumerable<ListingDto> listings, CancellationToken stoppingToken);
    Task<IEnumerable<ListingDto>> GetListingsBySourceAndItemIdAsync(Source source, int itemId, CancellationToken stoppingToken);
    Task DeleteListingsBySourceAndItemIdAsync(Source source, int itemId, CancellationToken stoppingToken);

    Task<IEnumerable<ProfitableListingDto>> GetProfitableListings(CancellationToken stoppingToken);

    Task PopulateMarketQueue(CancellationToken stoppingToken);
    Task<QueueItemDto> CreateQueueItem(ApiCallType callType, string endpointUrl, CancellationToken stoppingToken);
    Task<QueueItemDto?> GetNextQueueItem(CancellationToken stoppingToken);
    Task<QueueItemDto> IncrementQueueItemAttempts(Guid id, CancellationToken stoppingToken);
    Task<QueueItemDto> SetQueueItemCompleted(Guid id, CancellationToken stoppingToken);
    Task RemoveQueueItemsAsync(CancellationToken stoppingToken, QueueStatus? statusToRemove = null);
    Task RemoveQueueItemAsync(Guid id, CancellationToken stoppingToken);
    
    Task<int> GetApiKeyCountAsync(CancellationToken stoppingToken);
    Task<string> GetNextApiKeyAsync(CancellationToken stoppingToken);
    Task<UserDto> UpsertUserDetailsAsync(UserDetailsInputModel userDetails, CancellationToken stoppingToken);
    Task<UserDto?> ToggleUserFavourite(UserFavouriteInputModel userFavouriteModel, CancellationToken stoppingToken);
}