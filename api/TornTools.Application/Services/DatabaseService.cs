using System.Diagnostics;
using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.Constants;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;
using TornTools.Core.Helpers;
using TornTools.Core.Models.InputModels;
using TornTools.Cron.Enums;
using TornTools.Persistence.Interfaces;

namespace TornTools.Application.Services;

public class DatabaseService(
    ILogger<DatabaseService> logger,
    IMetricsCollector metricsCollector,
    IForeignStockItemRepository foreignStockItemRepository,
    IItemChangeLogRepository itemChangeLogRepository,
    IItemRepository itemRepository,
    IListingRepository listingRepository,
    IQueueItemRepository queueItemRepository,
    IUserRepository userRepository
) : IDatabaseService
{
    private readonly ILogger<DatabaseService> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly IMetricsCollector _metricsCollector = metricsCollector ?? throw new ArgumentNullException(nameof(metricsCollector));
    private readonly IForeignStockItemRepository _foreignStockItemRepository = foreignStockItemRepository ?? throw new ArgumentNullException(nameof(foreignStockItemRepository));
    private readonly IItemChangeLogRepository _itemChangeLogRepository = itemChangeLogRepository ?? throw new ArgumentNullException(nameof(itemChangeLogRepository));
    private readonly IItemRepository _itemRepository = itemRepository ?? throw new ArgumentNullException(nameof(itemRepository));
    private readonly IListingRepository _listingRepository = listingRepository ?? throw new ArgumentNullException(nameof(listingRepository));
    private readonly IQueueItemRepository _queueItemRepository = queueItemRepository ?? throw new ArgumentNullException(nameof(queueItemRepository));
    private readonly IUserRepository _userRepository = userRepository ?? throw new ArgumentNullException(nameof(userRepository));

    public Task<IEnumerable<ForeignStockItemDto>> GetForeignStockItemsAsync(CancellationToken cancellationToken)
    {
        return TrackDatabaseCallAsync(
            nameof(GetForeignStockItemsAsync),
            () => _foreignStockItemRepository.GetItemsAsync(cancellationToken));
    }

    public Task UpsertForeignStockItemsAsync(IEnumerable<ForeignStockItemDto> items, CancellationToken stoppingToken)
    {
        return TrackDatabaseCallAsync(
            nameof(UpsertForeignStockItemsAsync),
            () => _foreignStockItemRepository.UpsertItemsAsync(items, stoppingToken));
    }

    public Task CreateItemChangeLogAsync(ItemChangeLogDto changeLogDto, CancellationToken stoppingToken)
    {
        return TrackDatabaseCallAsync(
            nameof(CreateItemChangeLogAsync),
            () => _itemChangeLogRepository.CreateItemChangeLogAsync(changeLogDto, stoppingToken));
    }

    public Task<IEnumerable<ItemDto>> GetAllItemsAsync(CancellationToken stoppingToken)
    {
        return TrackDatabaseCallAsync(
            nameof(GetAllItemsAsync),
            () => _itemRepository.GetAllItemsAsync(stoppingToken));
    }

    public Task<int> GetNumberOfItemsAsync(CancellationToken stoppingToken)
    {
        return TrackDatabaseCallAsync(
            nameof(GetNumberOfItemsAsync),
            () => _itemRepository.GetNumberOfItemsAsync(stoppingToken));
    }

    public Task UpsertItemsAsync(IEnumerable<ItemDto> items, CancellationToken stoppingToken)
    {
        return TrackDatabaseCallAsync(
            nameof(UpsertItemsAsync),
            () => _itemRepository.UpsertItemsAsync(items, stoppingToken));
    }

    public Task<IEnumerable<ItemHistoryPointDto>> GetItemPriceHistoryAsync(int itemId, HistoryWindow window, CancellationToken stoppingToken)
    {
        return TrackDatabaseCallAsync(
            nameof(GetItemPriceHistoryAsync),
            () => _itemChangeLogRepository.GetItemPriceHistoryAsync(itemId, window, stoppingToken));
    }

    public Task<IEnumerable<ItemHistoryPointDto>> GetItemVelocityHistoryAsync(int itemId, HistoryWindow window, CancellationToken stoppingToken)
    {
        return TrackDatabaseCallAsync(
            nameof(GetItemVelocityHistoryAsync),
            () => _itemChangeLogRepository.GetItemVelocityHistoryAsync(itemId, window, stoppingToken));
    }

    public Task CreateListingsAsync(IEnumerable<ListingDto> listings, CancellationToken stoppingToken)
    {
        return TrackDatabaseCallAsync(
            nameof(CreateListingsAsync),
            () => _listingRepository.CreateListingsAsync(listings, stoppingToken));
    }

    public Task<IEnumerable<ListingDto>> GetListingsByItemIdAsync(int itemId, CancellationToken stoppingToken)
    {
        return TrackDatabaseCallAsync(
            nameof(GetListingsByItemIdAsync),
            () => _listingRepository.GetListingsByItemIdAsync(itemId, stoppingToken));
    }

    public Task<IEnumerable<ListingDto>> GetListingsBySourceAndItemIdAsync(Source source, int itemId, CancellationToken stoppingToken)
    {
        return TrackDatabaseCallAsync(
            nameof(GetListingsBySourceAndItemIdAsync),
            () => _listingRepository.GetListingsBySourceAndItemIdAsync(source, itemId, stoppingToken));
    }

    public Task DeleteListingsBySourceAndItemIdAsync(Source source, int itemId, CancellationToken stoppingToken)
    {
        return TrackDatabaseCallAsync(
            nameof(DeleteListingsBySourceAndItemIdAsync),
            () => _listingRepository.DeleteListingsBySourceAndItemIdAsync(source, itemId, stoppingToken));
    }

    public Task<IEnumerable<ProfitableListingDto>> GetProfitableListings(CancellationToken stoppingToken)
    {
        return TrackDatabaseCallAsync(
            nameof(GetProfitableListings),
            () => _itemRepository.GetProfitableItemsAsync(stoppingToken));
    }

    public async Task PopulateMarketQueueItemsOfInterest(CancellationToken stoppingToken)
    {
        // Anything appearing in the profitable listings should be prioritized.
        // Anything that has changed recently will also be useful to scan.
        var (profitableItemIds, groupedChanges) = await GetItemChangeData(stoppingToken);

        var profitableQueueItems = profitableItemIds
            .SelectMany(BuildQueueItems)
            .ToList();

        // Build the final queue, starting with the most frequently changing markets.
        // Repeat calls for the profitable and grouped items, with small batches of
        // left over items in between to ensure they get processed eventually.
        var queueItems = new List<QueueItemDto>();
        if (groupedChanges.Count != 0)
        {
            var maxNumberOfChanges = groupedChanges.Values.Max();
            for (var numberOfChanges = maxNumberOfChanges; numberOfChanges > 0; numberOfChanges--)
            {
                // Ensure that markets which change regularly are checked most often
                var itemsToProcess = groupedChanges
                    .Where(kv => kv.Value >= numberOfChanges)
                    .Select(kv => kv.Key)
                    .SelectMany(BuildQueueItems);

                queueItems.AddRange(itemsToProcess);

                // Include anything appearing in the profitable listings
                // so we don't leave old entries in the list for too long
                queueItems.AddRange(profitableQueueItems);
            }
        }
        else
        {
            queueItems.AddRange(profitableQueueItems);
        }

        await TrackDatabaseCallAsync(
            nameof(_queueItemRepository.CreateQueueItemsAsync),
            () => _queueItemRepository.CreateQueueItemsAsync(queueItems, stoppingToken));
    }

    public async Task PopulateMarketQueueItemsRemaining(CancellationToken stoppingToken)
    {
        var (profitableItemIds, groupedChanges) = await GetItemChangeData(stoppingToken);

        var marketItems = await TrackDatabaseCallAsync(
            nameof(_itemRepository.GetMarketItemsAsync),
            () => _itemRepository.GetMarketItemsAsync(stoppingToken));
        var queueItems = marketItems
            .Select(item => item.Id)
            .Except(profitableItemIds)
            .Except(groupedChanges.Keys)
            .SelectMany(BuildQueueItems)
            .ToList();

        await TrackDatabaseCallAsync(
            nameof(_queueItemRepository.CreateQueueItemsAsync),
            () => _queueItemRepository.CreateQueueItemsAsync(queueItems, stoppingToken));
    }

    public Task<QueueItemDto> CreateQueueItem(ApiCallType callType, string endpointUrl, CancellationToken stoppingToken)
    {
        return TrackDatabaseCallAsync(
            nameof(CreateQueueItem),
            () => _queueItemRepository.CreateQueueItemAsync(callType, endpointUrl, stoppingToken));
    }

    public Task<QueueItemDto?> GetNextQueueItem(CancellationToken stoppingToken)
    {
        return TrackDatabaseCallAsync(
            nameof(GetNextQueueItem),
            () => _queueItemRepository.GetNextQueueItemAsync(stoppingToken));
    }

    public Task<QueueItemDto> IncrementQueueItemAttempts(Guid id, CancellationToken stoppingToken)
    {
        return TrackDatabaseCallAsync(
            nameof(IncrementQueueItemAttempts),
            () => _queueItemRepository.IncrementQueueItemAttemptsAsync(id, stoppingToken));
    }

    public Task<QueueItemDto> SetQueueItemCompleted(Guid id, CancellationToken stoppingToken)
    {
        return TrackDatabaseCallAsync(
            nameof(SetQueueItemCompleted),
            () => _queueItemRepository.SetQueueItemCompletedAsync(id, stoppingToken));
    }

    public Task RemoveQueueItemsAsync(CancellationToken stoppingToken, QueueStatus? statusToRemove = null)
    {
        return TrackDatabaseCallAsync(
            nameof(RemoveQueueItemsAsync),
            () => _queueItemRepository.RemoveQueueItemsAsync(stoppingToken, statusToRemove));
    }

    public Task RemoveQueueItemAsync(Guid id, CancellationToken stoppingToken)
    {
        return TrackDatabaseCallAsync(
            nameof(RemoveQueueItemAsync),
            () => _queueItemRepository.RemoveQueueItemAsync(id, stoppingToken));
    }

    public Task<int> GetApiKeyCountAsync(CancellationToken stoppingToken)
    {
        return TrackDatabaseCallAsync(
            nameof(GetApiKeyCountAsync),
            () => _userRepository.GetApiKeyCountAsync(stoppingToken));
    }

    public Task<string> GetNextApiKeyAsync(CancellationToken stoppingToken)
    {
        return TrackDatabaseCallAsync(
            nameof(GetNextApiKeyAsync),
            () => _userRepository.GetNextApiKeyAsync(stoppingToken));
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

        return TrackDatabaseCallAsync(
            nameof(UpsertUserDetailsAsync),
            () => _userRepository.UpsertUserDetailsAsync(userDto, stoppingToken));
    }

    public Task<UserDto?> ToggleUserFavourite(UserFavouriteInputModel model, CancellationToken stoppingToken)
    {
        return TrackDatabaseCallAsync(
            nameof(ToggleUserFavourite),
            () => _userRepository.ToggleUserFavourite(model.UserId, model.ItemId, model.Add, stoppingToken));
    }

    public Task<IEnumerable<ThemeDto>> GetThemesAsync(long? userId, CancellationToken stoppingToken)
    {
        return TrackDatabaseCallAsync(
            nameof(GetThemesAsync),
            () => _userRepository.GetThemesAsync(userId, stoppingToken));
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

        return TrackDatabaseCallAsync(
            nameof(UpsertThemeAsync),
            () => _userRepository.UpsertThemeAsync(dto, stoppingToken));
    }

    public Task<UserDto?> UpdateUserPreferredThemeAsync(UserThemeSelectionInputModel inputModel, CancellationToken stoppingToken)
    {
        return TrackDatabaseCallAsync(
            nameof(UpdateUserPreferredThemeAsync),
            () => _userRepository.UpdateUserPreferredThemeAsync(inputModel.UserId, inputModel.ThemeId, stoppingToken));
    }

    private async Task<T> TrackDatabaseCallAsync<T>(string operation, Func<Task<T>> action)
    {
        var stopwatch = Stopwatch.StartNew();
        try
        {
            var result = await action();
            stopwatch.Stop();

            _metricsCollector.RecordDatabaseCall(operation, stopwatch.Elapsed, success: true);
            _logger.LogInformation(
                "Database call {Operation} succeeded in {ElapsedMs} ms.",
                operation,
                Math.Round(stopwatch.Elapsed.TotalMilliseconds, 2));

            return result;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _metricsCollector.RecordDatabaseCall(operation, stopwatch.Elapsed, success: false);
            _logger.LogError(
                ex,
                "Database call {Operation} failed after {ElapsedMs} ms.",
                operation,
                Math.Round(stopwatch.Elapsed.TotalMilliseconds, 2));
            throw;
        }
    }

    private async Task TrackDatabaseCallAsync(string operation, Func<Task> action)
    {
        var stopwatch = Stopwatch.StartNew();
        try
        {
            await action();
            stopwatch.Stop();

            _metricsCollector.RecordDatabaseCall(operation, stopwatch.Elapsed, success: true);
            _logger.LogInformation(
                "Database call {Operation} succeeded in {ElapsedMs} ms.",
                operation,
                Math.Round(stopwatch.Elapsed.TotalMilliseconds, 2));
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _metricsCollector.RecordDatabaseCall(operation, stopwatch.Elapsed, success: false);
            _logger.LogError(
                ex,
                "Database call {Operation} failed after {ElapsedMs} ms.",
                operation,
                Math.Round(stopwatch.Elapsed.TotalMilliseconds, 2));
            throw;
        }
    }

    private async Task<(HashSet<int> profitableItemIds, Dictionary<int, int> groupedChanges)> GetItemChangeData(CancellationToken stoppingToken)
    {
        var profitableItems = await TrackDatabaseCallAsync(
            nameof(_itemRepository.GetProfitableItemsAsync),
            () => _itemRepository.GetProfitableItemsAsync(stoppingToken));
        var profitableItemIds = profitableItems
            .Where(pi => pi.Profit >= QueueProcessorConstants.MinProfitToPrioritise)
            .Select(pi => pi.ItemId)
            .ToHashSet();

        var changeLogs = await TrackDatabaseCallAsync(
            nameof(_itemChangeLogRepository.GetRecentItemChangeLogsAsync),
            () => _itemChangeLogRepository.GetRecentItemChangeLogsAsync(TimeConstants.TimeWindowHours, stoppingToken));
        var groupedChanges = changeLogs
            .Where(log => !profitableItemIds.Contains(log.ItemId))
            .GroupBy(log => log.ItemId)
            .Select(group => new
            {
                ItemId = group.Key,
                Weight = (int)Math.Ceiling(group.Count() / QueueProcessorConstants.GroupDivisor)
            })
            .ToDictionary(x => x.ItemId, x => x.Weight);

        return (profitableItemIds, groupedChanges);
    }

    private static List<QueueItemDto> BuildQueueItems(int itemId)
    {
        var queueItems = new List<QueueItemDto>();

        var itemMarketQueueItem = new QueueItemDto
        {
            CallType = ApiCallType.TornMarketListings,
            EndpointUrl = string.Format(TornApiConstants.ItemListings, itemId),
            HttpMethod = "GET",
            ItemStatus = nameof(QueueStatus.Pending),
            CreatedAt = DateTime.UtcNow
        };
        queueItems.Add(itemMarketQueueItem);

        return queueItems;
    }
}
