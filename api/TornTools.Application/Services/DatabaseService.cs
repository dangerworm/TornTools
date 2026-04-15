using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.Constants;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;
using TornTools.Core.Extensions;
using TornTools.Core.Models.InputModels;
using TornTools.Cron.Enums;
using TornTools.Persistence.Interfaces;

namespace TornTools.Application.Services;

public class DatabaseService(
    ILogger<DatabaseService> logger,
    IForeignStockItemRepository foreignStockItemRepository,
    IItemChangeLogRepository itemChangeLogRepository,
    IItemChangeLogSummaryRepository itemChangeLogSummaryRepository,
    IItemRepository itemRepository,
    IListingRepository listingRepository,
    IQueueItemRepository queueItemRepository,
    IUserRepository userRepository
) : IDatabaseService
{
  private const double SummaryBucketSeconds = 6 * 3600;

  private readonly ILogger<DatabaseService> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
  private readonly IForeignStockItemRepository _foreignStockItemRepository = foreignStockItemRepository ?? throw new ArgumentNullException(nameof(foreignStockItemRepository));
  private readonly IItemChangeLogRepository _itemChangeLogRepository = itemChangeLogRepository ?? throw new ArgumentNullException(nameof(itemChangeLogRepository));
  private readonly IItemChangeLogSummaryRepository _itemChangeLogSummaryRepository = itemChangeLogSummaryRepository ?? throw new ArgumentNullException(nameof(itemChangeLogSummaryRepository));
  private readonly IItemRepository _itemRepository = itemRepository ?? throw new ArgumentNullException(nameof(itemRepository));
  private readonly IListingRepository _listingRepository = listingRepository ?? throw new ArgumentNullException(nameof(listingRepository));
  private readonly IQueueItemRepository _queueItemRepository = queueItemRepository ?? throw new ArgumentNullException(nameof(queueItemRepository));
  private readonly IUserRepository _userRepository = userRepository ?? throw new ArgumentNullException(nameof(userRepository));

  public Task<IEnumerable<ForeignStockItemDto>> GetForeignStockItemsAsync(CancellationToken cancellationToken)
  {
    return _foreignStockItemRepository.GetItemsAsync(cancellationToken);
  }

  public Task UpsertForeignStockItemsAsync(IEnumerable<ForeignStockItemDto> items, CancellationToken stoppingToken)
  {
    return _foreignStockItemRepository.UpsertItemsAsync(items, stoppingToken);
  }

  public Task CreateItemChangeLogAsync(ItemChangeLogDto changeLogDto, CancellationToken stoppingToken)
  {
    return _itemChangeLogRepository.CreateItemChangeLogAsync(changeLogDto, stoppingToken);
  }

  public async Task SummariseChangeLogsAsync(CancellationToken stoppingToken)
  {
    var latestBucketStart = await _itemChangeLogSummaryRepository.GetLatestBucketStartAsync(stoppingToken);

    DateTimeOffset fromBucket;
    if (latestBucketStart.HasValue)
    {
      fromBucket = latestBucketStart.Value;
    }
    else
    {
      var earliestChangeTime = await _itemChangeLogRepository.GetEarliestChangeTimeAsync(stoppingToken);
      if (earliestChangeTime is null) return;
      fromBucket = AlignToBucketBoundary(earliestChangeTime.Value, SummaryBucketSeconds);
    }

    var currentBucketStart = AlignToBucketBoundary(DateTimeOffset.UtcNow, SummaryBucketSeconds);
    if (fromBucket >= currentBucketStart) return;

    await _itemChangeLogSummaryRepository.BuildSummariesAsync(fromBucket, currentBucketStart, SummaryBucketSeconds, stoppingToken);
  }

  public Task<IEnumerable<ItemDto>> GetAllItemsAsync(CancellationToken stoppingToken)
  {
    return _itemRepository.GetAllItemsAsync(stoppingToken);
  }

  public Task<int> GetNumberOfItemsAsync(CancellationToken stoppingToken)
  {
    return _itemRepository.GetNumberOfItemsAsync(stoppingToken);
  }

  public Task UpsertItemsAsync(IEnumerable<ItemDto> items, CancellationToken stoppingToken)
  {
    return _itemRepository.UpsertItemsAsync(items, stoppingToken);
  }

  public async Task<IEnumerable<ItemHistoryPointDto>> GetItemPriceHistoryAsync(int itemId, HistoryWindow window, CancellationToken stoppingToken)
  {
    if (window >= HistoryWindow.Month1)
    {
      var (range, bucket) = window.ToWindowConfiguration();
      var now = DateTimeOffset.UtcNow;
      var summary = await _itemChangeLogSummaryRepository.GetPriceHistoryAsync(itemId, now.Subtract(range), now, bucket.TotalSeconds, stoppingToken);
      if (summary.Any()) return summary;
    }
    return await _itemChangeLogRepository.GetItemPriceHistoryAsync(itemId, window, stoppingToken);
  }

  public async Task<IEnumerable<ItemHistoryPointDto>> GetItemVelocityHistoryAsync(int itemId, HistoryWindow window, CancellationToken stoppingToken)
  {
    if (window >= HistoryWindow.Month1)
    {
      var (range, bucket) = window.ToWindowConfiguration();
      var now = DateTimeOffset.UtcNow;
      var summary = await _itemChangeLogSummaryRepository.GetVelocityHistoryAsync(itemId, now.Subtract(range), now, bucket.TotalSeconds, stoppingToken);
      if (summary.Any()) return summary;
    }
    return await _itemChangeLogRepository.GetItemVelocityHistoryAsync(itemId, window, stoppingToken);
  }

  private static DateTimeOffset AlignToBucketBoundary(DateTimeOffset time, double bucketSeconds)
  {
    var epoch = DateTimeOffset.UnixEpoch;
    var totalSeconds = (long)(time - epoch).TotalSeconds;
    var bucketSize = (long)bucketSeconds;
    return epoch.AddSeconds((totalSeconds / bucketSize) * bucketSize);
  }

  public Task CreateListingsAsync(IEnumerable<ListingDto> listings, CancellationToken stoppingToken)
  {
    return _listingRepository.CreateListingsAsync(listings, stoppingToken);
  }

  public Task<IEnumerable<ListingDto>> GetListingsByItemIdAsync(int itemId, CancellationToken stoppingToken)
  {
    return _listingRepository.GetListingsByItemIdAsync(itemId, stoppingToken);
  }

  public Task<IEnumerable<ListingDto>> GetListingsBySourceAndItemIdAsync(Source source, int itemId, CancellationToken stoppingToken)
  {
    return _listingRepository.GetListingsBySourceAndItemIdAsync(source, itemId, stoppingToken);
  }

  public Task DeleteListingsBySourceAndItemIdAsync(Source source, int itemId, CancellationToken stoppingToken)
  {
    return _listingRepository.DeleteListingsBySourceAndItemIdAsync(source, itemId, stoppingToken);
  }

  public Task ReplaceListingsAsync(Source source, int itemId, IEnumerable<ListingDto> newListings, CancellationToken stoppingToken)
  {
    return _listingRepository.ReplaceListingsAsync(source, itemId, newListings, stoppingToken);
  }

  public Task TouchListingsTimestampAsync(Source source, int itemId, DateTimeOffset timestamp, CancellationToken stoppingToken)
  {
    return _listingRepository.TouchListingsTimestampAsync(source, itemId, timestamp, stoppingToken);
  }

  public async Task ProcessListingsAsync(Source source, int itemId, List<ListingDto> newListings, CancellationToken stoppingToken)
  {
    newListings = [.. newListings
        .Where(nl => nl is not null)
        .OrderBy(l => l.Price)
        .Take(QueryConstants.NumberOfListingsToStorePerItem)];

    if (newListings.Count == 0)
      return;

    var previousListings = (await GetListingsBySourceAndItemIdAsync(source, itemId, stoppingToken))
        .OrderBy(l => l.Price)
        .Take(QueryConstants.NumberOfListingsToStorePerItem)
        .ToList();

    if (previousListings.Count == 0)
    {
      await CreateListingsAsync(newListings, stoppingToken);
      return;
    }

    var previousMinimumPrice = previousListings.First().Price;
    var newMinimumPrice = newListings.Min(l => l.Price);

    var hasMarketChanged = previousListings.Count != newListings.Count;
    var hasMinimumPriceChanged = previousMinimumPrice != newMinimumPrice;

    if (!hasMarketChanged && !hasMinimumPriceChanged)
    {
      var i = 0;
      while (i < previousListings.Count)
      {
        if (previousListings[i].Price != newListings[i].Price || previousListings[i].Quantity != newListings[i].Quantity)
        {
          hasMarketChanged = true;
          break;
        }
        i++;
      }
    }

    if (hasMarketChanged || hasMinimumPriceChanged)
    {
      _logger.LogInformation(
          "Market change detected for item {ItemId} ({Source}): minimum price {PreviousPrice} → {NewPrice}.",
          itemId, source, previousMinimumPrice, newMinimumPrice);

      await CreateItemChangeLogAsync(new ItemChangeLogDto
      {
        ItemId = itemId,
        Source = source,
        NewPrice = newMinimumPrice,
        ChangeTime = DateTime.UtcNow,
      }, stoppingToken);

      await ReplaceListingsAsync(source, itemId, newListings, stoppingToken);
    }
    else
    {
      await TouchListingsTimestampAsync(source, itemId, DateTimeOffset.UtcNow, stoppingToken);
    }
  }

  public Task<IEnumerable<ProfitableListingDto>> GetProfitableListingsAsync(CancellationToken stoppingToken)
  {
    return _itemRepository.GetProfitableItemsAsync(stoppingToken);
  }

  public Task<IEnumerable<BazaarSummaryDto>> GetBazaarSummariesAsync(CancellationToken stoppingToken)
  {
    return _listingRepository.GetBazaarSummariesAsync(stoppingToken);
  }

  public async Task PopulateQueueWithStaleMarketItems(CancellationToken stoppingToken)
  {
    var staleItems = await _itemRepository.GetStaleMarketItemIdsAsync(TimeConstants.StaleListingThresholdHours, stoppingToken);

    var queueItems = staleItems
        .Select(item => item.Source == Source.Torn.ToString()
            ? BuildTornMarketQueueItem(item.ItemId)
            : BuildWeav3rQueueItem(item.ItemId))
        .ToList();

    if (queueItems.Count > 0)
    {
      await _queueItemRepository.CreateQueueItemsAsync(queueItems, stoppingToken);
    }
  }

  public async Task PopulateQueueWithTornMarketItems(CancellationToken stoppingToken)
  {
    var minChanges = 2 * 7 * 24 / TimeConstants.StaleListingThresholdHours;
    var itemIds = (await _itemRepository.GetActiveMarketItemsForQueueAsync(minChanges, stoppingToken)).ToList();

    if (itemIds.Count == 0)
    {
      _logger.LogInformation("No active market items found for TML; falling back to stale scan.");
      await PopulateQueueWithStaleMarketItems(stoppingToken);
      return;
    }

    await _queueItemRepository.CreateQueueItemsAsync(BuildTornMarketQueueItems(itemIds), stoppingToken);
  }

  public async Task PopulateQueueWithWeav3rItems(CancellationToken stoppingToken)
  {
    var minChanges = 2 * 7 * 24 / TimeConstants.StaleListingThresholdHours;
    var itemIds = (await _itemRepository.GetActiveMarketItemsForQueueAsync(minChanges, stoppingToken)).ToList();

    if (itemIds.Count == 0)
    {
      _logger.LogInformation("No active market items found for WBL; skipping Weav3r population.");
      return;
    }

    await _queueItemRepository.CreateQueueItemsAsync(BuildWeav3rQueueItems(itemIds), stoppingToken);
  }

  public Task<QueueItemDto> CreateQueueItem(ApiCallType callType, string endpointUrl, CancellationToken stoppingToken)
  {
    return _queueItemRepository.CreateQueueItemAsync(callType, endpointUrl, stoppingToken);
  }

  public Task<QueueItemDto?> GetNextQueueItem(ApiCallType callType, CancellationToken stoppingToken)
  {
    return _queueItemRepository.GetNextQueueItemAsync(callType, stoppingToken);
  }

  public Task<bool> HasInProgressItems(ApiCallType callType, CancellationToken stoppingToken)
  {
    return _queueItemRepository.HasInProgressItemsAsync(callType, stoppingToken);
  }

  public Task<QueueItemDto> IncrementQueueItemAttempts(Guid id, CancellationToken stoppingToken)
  {
    return _queueItemRepository.IncrementQueueItemAttemptsAsync(id, stoppingToken);
  }

  public Task<QueueItemDto> SetQueueItemCompleted(Guid id, CancellationToken stoppingToken)
  {
    return _queueItemRepository.SetQueueItemCompletedAsync(id, stoppingToken);
  }

  public Task RemoveQueueItemsAsync(CancellationToken stoppingToken)
  {
    return _queueItemRepository.RemoveQueueItemsAsync(stoppingToken);
  }

  public Task RemoveQueueItemsAsync(ApiCallType callType, CancellationToken stoppingToken)
  {
    return _queueItemRepository.RemoveQueueItemsAsync(callType, stoppingToken);
  }

  public Task RemoveQueueItemAsync(Guid id, CancellationToken stoppingToken)
  {
    return _queueItemRepository.RemoveQueueItemAsync(id, stoppingToken);
  }

  public Task<UserDto?> GetUserByIdAsync(long userId, CancellationToken stoppingToken)
  {
    return _userRepository.GetUserByIdAsync(userId, stoppingToken);
  }

  public Task<List<UserDto>> GetUsersAsync(CancellationToken stoppingToken)
  {
    return _userRepository.GetUsersAsync(stoppingToken);
  }

  public Task<int> GetApiKeyCountAsync(CancellationToken stoppingToken)
  {
    return _userRepository.GetApiKeyCountAsync(stoppingToken);
  }

  public Task<string> GetNextApiKeyAsync(CancellationToken stoppingToken)
  {
    return _userRepository.GetNextApiKeyAsync(stoppingToken);
  }

  public Task MarkKeyUnavailableAsync(long userId, CancellationToken stoppingToken)
  {
    return _userRepository.MarkKeyUnavailableAsync(userId, stoppingToken);
  }

  public Task MarkKeyUnavailableByApiKeyAsync(string apiKey, CancellationToken stoppingToken)
  {
    return _userRepository.MarkKeyUnavailableByApiKeyAsync(apiKey, stoppingToken);
  }

  public Task<UserDto> UpsertUserDetailsAsync(UserDetailsInputModel userDetails, CancellationToken stoppingToken)
  {
    var userDto = new UserDto
    {
      ApiKey = userDetails.ApiKey,
      Id = userDetails.UserProfile.Id,
      Name = userDetails.UserProfile.Name,
      Level = userDetails.UserProfile.Level,
      Gender = userDetails.UserProfile.Gender
    };

    return _userRepository.UpsertUserDetailsAsync(userDto, stoppingToken);
  }

  public Task<UserDto?> ToggleUserFavourite(UserFavouriteInputModel model, CancellationToken stoppingToken)
  {
    return _userRepository.ToggleUserFavourite(model.UserId, model.ItemId, model.Add, stoppingToken);
  }

  public Task<IEnumerable<ThemeDto>> GetThemesAsync(long? userId, CancellationToken stoppingToken)
  {
    return _userRepository.GetThemesAsync(userId, stoppingToken);
  }

  public Task<ThemeDto> UpsertThemeAsync(ThemeInputModel themeInputModel, CancellationToken stoppingToken)
  {
    var dto = new ThemeDto
    {
      Id = themeInputModel.Id ?? 0,
      Name = themeInputModel.Name,
      Mode = themeInputModel.Mode,
      PrimaryColor = themeInputModel.PrimaryColor,
      SecondaryColor = themeInputModel.SecondaryColor,
      UserId = themeInputModel.UserId
    };

    return _userRepository.UpsertThemeAsync(dto, stoppingToken);
  }

  public Task<UserDto?> UpdateUserPreferredThemeAsync(UserThemeSelectionInputModel inputModel, CancellationToken stoppingToken)
  {
    return _userRepository.UpdateUserPreferredThemeAsync(inputModel.UserId, inputModel.ThemeId, stoppingToken);
  }

  private static IEnumerable<QueueItemDto> BuildTornMarketQueueItems(IEnumerable<int> itemIds)
  {
    foreach (var itemId in itemIds)
    {
      yield return new QueueItemDto
      {
        CallType = ApiCallType.TornMarketListings,
        EndpointUrl = string.Format(TornApiConstants.ItemListings, itemId),
        HttpMethod = "GET",
        ItemStatus = nameof(QueueStatus.Pending),
        CreatedAt = DateTime.UtcNow
      };
    }
  }

  private static IEnumerable<QueueItemDto> BuildWeav3rQueueItems(IEnumerable<int> itemIds)
  {
    foreach (var itemId in itemIds)
    {
      yield return new QueueItemDto
      {
        CallType = ApiCallType.Weav3rBazaarListings,
        EndpointUrl = string.Format(Weav3rApiConstants.BazaarListings, itemId),
        HttpMethod = "GET",
        ItemStatus = nameof(QueueStatus.Pending),
        CreatedAt = DateTime.UtcNow
      };
    }
  }

  private static QueueItemDto BuildTornMarketQueueItem(int itemId)
  {
    return new QueueItemDto
    {
      CallType = ApiCallType.TornMarketListings,
      EndpointUrl = string.Format(TornApiConstants.ItemListings, itemId),
      HttpMethod = "GET",
      ItemStatus = nameof(QueueStatus.Pending),
      CreatedAt = DateTime.UtcNow
    };
  }

  private static QueueItemDto BuildWeav3rQueueItem(int itemId)
  {
    return new QueueItemDto
    {
      CallType = ApiCallType.Weav3rBazaarListings,
      EndpointUrl = string.Format(Weav3rApiConstants.BazaarListings, itemId),
      HttpMethod = "GET",
      ItemStatus = nameof(QueueStatus.Pending),
      CreatedAt = DateTime.UtcNow
    };
  }
}
