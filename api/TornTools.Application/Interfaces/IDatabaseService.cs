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
  Task SummariseChangeLogsAsync(CancellationToken stoppingToken);

  Task<IEnumerable<ItemDto>> GetAllItemsAsync(CancellationToken stoppingToken);
  Task<int> GetNumberOfItemsAsync(CancellationToken stoppingToken);
  Task UpsertItemsAsync(IEnumerable<ItemDto> items, CancellationToken stoppingToken);
  Task<IEnumerable<ItemHistoryPointDto>> GetItemPriceHistoryAsync(int itemId, HistoryWindow window, Source source, CancellationToken stoppingToken);
  Task<IEnumerable<ItemHistoryPointDto>> GetItemVelocityHistoryAsync(int itemId, HistoryWindow window, Source source, CancellationToken stoppingToken);

  Task CreateListingsAsync(IEnumerable<ListingDto> listings, CancellationToken stoppingToken);
  Task<IEnumerable<ListingDto>> GetListingsBySourceAndItemIdAsync(Source source, int itemId, CancellationToken stoppingToken);
  Task DeleteListingsBySourceAndItemIdAsync(Source source, int itemId, CancellationToken stoppingToken);
  Task ReplaceListingsAsync(Source source, int itemId, IEnumerable<ListingDto> newListings, CancellationToken stoppingToken);
  Task TouchListingsTimestampAsync(Source source, int itemId, DateTimeOffset timestamp, CancellationToken stoppingToken);
  Task ProcessListingsAsync(Source source, int itemId, List<ListingDto> newListings, CancellationToken stoppingToken);

  Task<IEnumerable<ProfitableListingDto>> GetProfitableListingsAsync(CancellationToken stoppingToken);
  Task<IEnumerable<BazaarSummaryDto>> GetBazaarSummariesAsync(CancellationToken stoppingToken);

  Task PopulateQueueWithStaleMarketItems(CancellationToken stoppingToken);
  Task PopulateQueueWithTornMarketItems(CancellationToken stoppingToken);
  Task PopulateQueueWithWeav3rItems(CancellationToken stoppingToken);
  Task<QueueItemDto> CreateQueueItem(ApiCallType callType, string endpointUrl, CancellationToken stoppingToken);
  Task<QueueItemDto?> GetNextQueueItem(ApiCallType callType, CancellationToken stoppingToken);
  Task<bool> HasInProgressItems(ApiCallType callType, CancellationToken stoppingToken);
  Task<QueueItemDto> IncrementQueueItemAttempts(Guid id, CancellationToken stoppingToken);
  Task<QueueItemDto> SetQueueItemCompleted(Guid id, CancellationToken stoppingToken);
  Task RemoveQueueItemsAsync(CancellationToken stoppingToken);
  Task RemoveQueueItemsAsync(ApiCallType callType, CancellationToken stoppingToken);
  Task RemoveInProgressItemsAsync(CancellationToken stoppingToken);
  Task RemoveQueueItemAsync(Guid id, CancellationToken stoppingToken);

  Task<int> GetApiKeyCountAsync(CancellationToken stoppingToken);
  Task<string> GetNextApiKeyAsync(CancellationToken stoppingToken);
  Task MarkKeyUnavailableAsync(long userId, CancellationToken stoppingToken);
  Task MarkKeyUnavailableByApiKeyAsync(string apiKey, CancellationToken stoppingToken);

  Task<UserDto?> GetUserByIdAsync(long userId, CancellationToken stoppingToken);
  Task<List<UserDto>> GetUsersAsync(CancellationToken stoppingToken);
  Task<UserDto> UpsertUserDetailsAsync(UserDetailsInputModel userDetails, CancellationToken stoppingToken);
  Task<UserDto?> ToggleUserFavourite(UserFavouriteInputModel userFavouriteModel, CancellationToken stoppingToken);
}