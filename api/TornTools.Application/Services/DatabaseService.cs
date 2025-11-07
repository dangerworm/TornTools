using Microsoft.Extensions.Logging;
using TornTools.Application.Callers;
using TornTools.Application.Handlers;
using TornTools.Application.Interfaces;
using TornTools.Core.Constants;
using TornTools.Core.DataTransferObjects;
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
        var items = await _itemRepository.GetAllItemsAsync(stoppingToken);
        foreach (var item in items.Take(3))
        {
            await _queueItemRepository.CreateQueueItemAsync(
                callHandler: nameof(TornMarketListingsApiCallHandler),
                endpointUrl: string.Format(TornApiEndpointConstants.ItemListings, item.Id),
                stoppingToken: stoppingToken
            );

            await _queueItemRepository.CreateQueueItemAsync(
                callHandler: nameof(Weav3rBazaarListingsApiCallHandler),
                endpointUrl: string.Format(Weav3rApiEndpointConstants.BazaarListings, item.Id),
                stoppingToken: stoppingToken
            );
        }
    }

    public Task<QueueItemDto> CreateQueueItem(string callHandler, string endpointUrl, CancellationToken stoppingToken)
    {
        return _queueItemRepository.CreateQueueItemAsync(callHandler, endpointUrl, stoppingToken);
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
