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
    IItemRepository itemRepository,
    IListingRepository listingRepository,
    IQueueItemRepository queueItemRepository
) : IDatabaseService
{
    private readonly ILogger<DatabaseService> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly IItemRepository _itemRepository = itemRepository ?? throw new ArgumentNullException(nameof(itemRepository));
    private readonly IListingRepository _listingRepository = listingRepository ?? throw new ArgumentNullException(nameof(listingRepository));
    private readonly IQueueItemRepository _queueItemRepository = queueItemRepository ?? throw new ArgumentNullException(nameof(queueItemRepository));

    public Task UpsertItemsAsync(IEnumerable<ItemDto> items, CancellationToken stoppingToken)
    {
        return _itemRepository.UpsertItemsAsync(items, stoppingToken);
    }

    public Task CreateListingsAsync(IEnumerable<ListingDto> listings, CancellationToken stoppingToken)
    {
        return _listingRepository.CreateListingsAsync(listings, stoppingToken);
    }

    public async Task PopulateQueue(CancellationToken stoppingToken)
    {
        var allItems = await _itemRepository.GetAllItemsAsync(stoppingToken);
        var items = allItems.ToList();

        /*=== TORN ITEM MARKET ===*/
        var itemMarketQueueItems = items.Take(ApiConstants.NumberOfItems).Select(item =>
            new QueueItemDto
            {
                CallType = CallType.TornMarketListings,
                EndpointUrl = string.Format(TornApiEndpointConstants.ItemListings, item.Id),
                HttpMethod = "GET",
                ItemStatus = nameof(QueueStatus.Pending),
                CreatedAt = DateTime.UtcNow
            }
        );
        await _queueItemRepository.CreateQueueItemsAsync(itemMarketQueueItems, stoppingToken);

        // Group by time window

        for (var i = 0; i < ApiConstants.NumberOfItems; i++)
        {
            var item = items.Skip(i).Take(1).First();

            await _queueItemRepository.CreateQueueItemAsync(
                callType: CallType.TornMarketListings,
                endpointUrl: string.Format(TornApiEndpointConstants.ItemListings, item.Id),
                stoppingToken: stoppingToken
            );

            await _queueItemRepository.CreateQueueItemAsync(
                callType: CallType.Weav3rBazaarListings,
                endpointUrl: string.Format(Weav3rApiEndpointConstants.BazaarListings, item.Id),
                stoppingToken: stoppingToken
            );
        }
    }

    public Task<QueueItemDto> CreateQueueItem(CallType callType, string endpointUrl, CancellationToken stoppingToken)
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
}
