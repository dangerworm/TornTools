using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.Constants;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;
using TornTools.Cron.Enums;
using TornTools.Persistence.Interfaces;

namespace TornTools.Application.Services;

public class DatabaseService(
    ILogger<DatabaseService> logger, 
    IItemChangeLogRepository itemChangeLogRepository,
    IItemRepository itemRepository,
    IListingRepository listingRepository,
    IQueueItemRepository queueItemRepository
) : IDatabaseService
{
    private readonly ILogger<DatabaseService> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly IItemChangeLogRepository _itemChangeLogRepository = itemChangeLogRepository ?? throw new ArgumentNullException(nameof(itemChangeLogRepository));
    private readonly IItemRepository _itemRepository = itemRepository ?? throw new ArgumentNullException(nameof(itemRepository));
    private readonly IListingRepository _listingRepository = listingRepository ?? throw new ArgumentNullException(nameof(listingRepository));
    private readonly IQueueItemRepository _queueItemRepository = queueItemRepository ?? throw new ArgumentNullException(nameof(queueItemRepository));


    public Task CreateItemChangeLogAsync(ItemChangeLogDto changeLogDto, CancellationToken stoppingToken)
    {
        return _itemChangeLogRepository.CreateItemChangeLogAsync(changeLogDto, stoppingToken);
    }

    public Task<int> GetNumberOfItemsAsync(CancellationToken stoppingToken)
    {
        return _itemRepository.GetNumberOfItemsAsync(stoppingToken);
    }

    public Task UpsertItemsAsync(IEnumerable<ItemDto> items, CancellationToken stoppingToken)
    {
        return _itemRepository.UpsertItemsAsync(items, stoppingToken);
    }

    public Task CreateListingsAsync(IEnumerable<ListingDto> listings, CancellationToken stoppingToken)
    {
        return _listingRepository.CreateListingsAsync(listings, stoppingToken);
    }

    public async Task<IEnumerable<ListingDto>> GetListingsByItemIdAsync(int itemId, CancellationToken stoppingToken)
    {
        return await _listingRepository.GetListingsByItemIdAsync(itemId, stoppingToken);
    }

    public async Task<IEnumerable<ListingDto>> GetListingsBySourceAndItemIdAsync(Source source, int itemId, CancellationToken stoppingToken)
    {
        return await _listingRepository.GetListingsBySourceAndItemIdAsync(source, itemId, stoppingToken);
    }

    public Task DeleteListingsBySourceAndItemIdAsync(Source source, int itemId, CancellationToken stoppingToken)
    {
        return _listingRepository.DeleteListingsBySourceAndItemIdAsync(source, itemId, stoppingToken);
    }

    public async Task PopulateQueue(CancellationToken stoppingToken)
    {
        // Find how many times each market has changed
        var changeLogs = await _itemChangeLogRepository.GetRecentItemChangeLogsAsync(TimeConstants.TimeWindowHours, stoppingToken);
        var groupedChanges = changeLogs
            .GroupBy(log => log.ItemId)
            .ToDictionary(g => g.Key, g => g.Count());

        var queueItems = new List<QueueItemDto>();
        if (groupedChanges.Count > 0)
        {
            var maxNumberOfChanges = groupedChanges.Values.Max();

            // Ensure that markets which change regularly are checked most often
            for (var numberOfChanges = maxNumberOfChanges; numberOfChanges >= 0; numberOfChanges--)
            {
                var itemsToProcess = groupedChanges
                    .Where(kv => kv.Value >= numberOfChanges)
                    .Select(kv => kv.Key)
                    .SelectMany(BuildQueueItems);

                queueItems.AddRange(itemsToProcess);
            }
        }

        // Add all items, including any remaining items which have not changed in the time window
        var allItems = await _itemRepository.GetResaleItemsAsync(stoppingToken);
        var itemIds = allItems.Select(i => i.Id);
        queueItems.AddRange(itemIds.Take(QueryConstants.MaxNumberOfItemsToProcess).SelectMany(BuildQueueItems));
        
        await _queueItemRepository.CreateQueueItemsAsync(queueItems, stoppingToken);
    }

    public Task<QueueItemDto> CreateQueueItem(ApiCallType callType, string endpointUrl, CancellationToken stoppingToken)
    {
        return _queueItemRepository.CreateQueueItemAsync(callType, endpointUrl, stoppingToken);
    }

    public Task<QueueItemDto?> GetNextQueueItem(CancellationToken stoppingToken)
    {
        return _queueItemRepository.GetNextQueueItemAsync(stoppingToken);
    }

    public Task<QueueItemDto> IncrementQueueItemAttempts(Guid id, CancellationToken stoppingToken)
    {
        return _queueItemRepository.IncrementQueueItemAttemptsAsync(id, stoppingToken);
    }

    public Task<QueueItemDto> SetQueueItemCompleted(Guid id, CancellationToken stoppingToken)
    {
        return _queueItemRepository.SetQueueItemCompletedAsync(id, stoppingToken);
    }

    public Task RemoveQueueItemsAsync(CancellationToken stoppingToken, QueueStatus? statusToRemove = null)
    {
        return _queueItemRepository.RemoveQueueItemsAsync(stoppingToken, statusToRemove);
    }

    private static List<QueueItemDto> BuildQueueItems(int itemId)
    {
        var queueItems = new List<QueueItemDto>();

        var itemMarketQueueItem = new QueueItemDto
        {
            CallType = ApiCallType.TornMarketListings,
            EndpointUrl = string.Format(TornApiEndpointConstants.ItemListings, itemId),
            HttpMethod = "GET",
            ItemStatus = nameof(QueueStatus.Pending),
            CreatedAt = DateTime.UtcNow
        };
        queueItems.Add(itemMarketQueueItem);

        //var bazaarQueueItem = new QueueItemDto
        //{
        //    CallType = CallType.Weav3rBazaarListings,
        //    EndpointUrl = string.Format(Weav3rApiEndpointConstants.BazaarListings, itemId),
        //    HttpMethod = "GET",
        //    ItemStatus = nameof(QueueStatus.Pending),
        //    CreatedAt = DateTime.UtcNow
        //};
        //queueItems.Add(itemMarketQueueItem);

        return queueItems;
    }
}
